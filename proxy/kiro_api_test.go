package proxy

import (
	"encoding/json"
	"errors"
	"io"
	"kiro-go/config"
	"net/http"
	"path/filepath"
	"strings"
	"testing"
)

func TestResolveProfileArnReturnsCachedValueWithoutRequest(t *testing.T) {
	kiroRestHttpStore.Store(&http.Client{
		Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
			t.Fatal("unexpected HTTP request for cached profile ARN")
			return nil, nil
		}),
	})
	t.Cleanup(func() { InitKiroHttpClient("") })

	account := &config.Account{ProfileArn: " arn:aws:codewhisperer:profile/test "}
	got, err := ResolveProfileArn(account)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "arn:aws:codewhisperer:profile/test" {
		t.Fatalf("expected trimmed cached ARN, got %q", got)
	}
}

func TestResolveProfileArnFetchesAndCachesProfile(t *testing.T) {
	configPath := filepath.Join(t.TempDir(), "config.json")
	if err := config.Init(configPath); err != nil {
		t.Fatalf("init config: %v", err)
	}
	account := config.Account{
		ID:          "acct-1",
		Email:       "user@example.com",
		Provider:    "Enterprise", // supportsProfiles=true (IdC group)
		AccessToken: "access-token",
		Region:      "us-east-1",
		UsageData:   json.RawMessage(`{"usageBreakdownList":[{"resourceType":"CREDIT","currentUsage":7,"usageLimit":100}]}`),
	}
	if err := config.AddAccount(account); err != nil {
		t.Fatalf("add account: %v", err)
	}

	kiroRestHttpStore.Store(&http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			if req.Method != http.MethodPost {
				t.Fatalf("expected POST, got %s", req.Method)
			}
			if req.URL.Path != "/ListAvailableProfiles" {
				t.Fatalf("expected ListAvailableProfiles path, got %s", req.URL.Path)
			}
			if got := req.Header.Get("Content-Type"); got != "application/json" {
				t.Fatalf("expected JSON content type, got %q", got)
			}
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(`{"profiles":[{"arn":" arn:aws:codewhisperer:profile/fetched "}]} `)),
				Header:     make(http.Header),
			}, nil
		}),
	})
	t.Cleanup(func() { InitKiroHttpClient("") })

	requestAccount := account
	requestAccount.UsageData = nil
	got, err := ResolveProfileArn(&requestAccount)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != "arn:aws:codewhisperer:profile/fetched" {
		t.Fatalf("expected fetched ARN, got %q", got)
	}
	if requestAccount.ProfileArn != got {
		t.Fatalf("expected account to be updated with fetched ARN, got %q", requestAccount.ProfileArn)
	}

	accounts := config.GetAccounts()
	if len(accounts) != 1 {
		t.Fatalf("expected one persisted account, got %d", len(accounts))
	}
	if accounts[0].ProfileArn != got {
		t.Fatalf("expected persisted account profile ARN %q, got %q", got, accounts[0].ProfileArn)
	}
	wantUsage := `{"usageBreakdownList":[{"resourceType":"CREDIT","currentUsage":7,"usageLimit":100}]}`
	if string(accounts[0].UsageData) != wantUsage {
		t.Fatalf("expected profile cache update to preserve usage data, got %q", string(accounts[0].UsageData))
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return fn(req)
}

// TestResolveProfileArnAllowsBuilderID verifies that Builder ID accounts are
// considered supported by supportsProfiles (matching Kiro IDE's client-side
// rule: provider === "BuilderId" is in the IdC group) and therefore DO trigger
// HTTP calls. AWS may still reject them server-side with 403, but that's a
// different code path from client-side short-circuit.
func TestResolveProfileArnAllowsBuilderID(t *testing.T) {
	called := false
	kiroRestHttpStore.Store(&http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			called = true
			// Simulate the real-world AWS 403 for Builder ID
			return &http.Response{
				StatusCode: 403,
				Body:       io.NopCloser(strings.NewReader(`{"message":"AWS Builder ID is not supported for this operation."}`)),
				Header:     make(http.Header),
			}, nil
		}),
	})
	t.Cleanup(func() { InitKiroHttpClient("") })

	account := &config.Account{
		ID:          "acct-builderid",
		Email:       "user@example.com",
		Provider:    "BuilderId",
		AccessToken: "access",
		// No RefreshToken so we don't try the second step (avoids needing to mock OIDC).
	}
	_, err := ResolveProfileArn(account)
	if err == nil {
		t.Fatal("expected error when Builder ID gets 403 from AWS, got nil")
	}
	if errors.Is(err, ErrProfileArnUnsupported) {
		t.Fatalf("Builder ID should not short-circuit on supportsProfiles (it's in the IdC group); err=%v", err)
	}
	if !called {
		t.Fatal("expected ListAvailableProfiles to be called for Builder ID account")
	}
}

// TestResolveProfileArnShortCircuitsUnsupportedType verifies that account types
// outside Kiro IDE's supportsProfiles whitelist (no IdC provider, no
// external_idp, no social authMethod) short-circuit immediately without HTTP.
func TestResolveProfileArnShortCircuitsUnsupportedType(t *testing.T) {
	kiroRestHttpStore.Store(&http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			t.Fatalf("unsupported account type should not trigger any HTTP request, but saw %s %s", req.Method, req.URL)
			return nil, nil
		}),
	})
	t.Cleanup(func() { InitKiroHttpClient("") })

	account := &config.Account{
		ID:          "acct-unknown",
		Email:       "user@example.com",
		Provider:    "",         // not in whitelist
		AuthMethod:  "anonymous", // not in whitelist
		AccessToken: "access",
	}
	_, err := ResolveProfileArn(account)
	if err == nil {
		t.Fatal("expected ErrProfileArnUnsupported for unknown account type, got nil")
	}
	if !errors.Is(err, ErrProfileArnUnsupported) {
		t.Fatalf("expected ErrProfileArnUnsupported sentinel, got %v", err)
	}
}
