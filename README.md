# kdx




TODO: Explain --http --no-ssh for handling for git urls


Examples of using git repository branches with the KDX emanator configuration:
(by default, all projects use `master` branch)
```
# --branch argument specifies common branch name for kaspad and kasparov
emanate --branch=v0.4.0-dev 
# branch for each repo can be overriden using --branch-<repo-name> argument
emanate --branch=v0.4.0-dev --kaspad-branch=v0.3.0-dev
emanate --miningsimulator-branch=v0.1.2-dev


```