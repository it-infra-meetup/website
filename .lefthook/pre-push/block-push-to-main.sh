#!/bin/sh
# Block accidental direct push to `main`.
#
# Lefthook 2.x does not forward git's pre-push stdin to hook scripts
# (the "<local_ref> <local_sha> <remote_ref> <remote_sha>" lines that
# would let us see the exact destination ref). We use two heuristics
# that work without stdin:
#
# 1. The current local branch is `main`. `git push` with no args sends
#    the current branch by default — this is what bit us before.
# 2. `git rev-parse --abbrev-ref @{push}` resolves to a ref ending in
#    `/main` (e.g. `origin/main`). That means the current branch is
#    explicitly configured to push to remote `main`.
#
# These cover the common accidental cases. For deliberate
# `git push <remote> feature:main` we rely on GitHub branch protection
# server-side.
#
# Bypass (rare, intentional): `git push --no-verify`.

current=$(git symbolic-ref --short HEAD 2>/dev/null || echo '')
if [ "$current" = "main" ]; then
  printf '\033[31m✗ Direct push from local "main" branch is blocked.\033[0m\n' >&2
  printf '  Switch to a feature branch and open a PR.\n' >&2
  printf '  Bypass (not recommended): git push --no-verify\n' >&2
  exit 1
fi

push_target=$(git rev-parse --abbrev-ref '@{push}' 2>/dev/null || echo '')
case "$push_target" in
  */main|main)
    printf '\033[31m✗ Current branch is configured to push to "main".\033[0m\n' >&2
    printf '  Reconfigure the push target or use a different remote ref.\n' >&2
    printf '  Bypass (not recommended): git push --no-verify\n' >&2
    exit 1
    ;;
esac
