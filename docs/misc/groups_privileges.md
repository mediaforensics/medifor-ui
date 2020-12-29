# Users, Grouping and Special Privileges

The Medifor UI system provides an opt-in 'grouping' feature. When this feature is enabled system users are added to users groups and are permitted to upload media to their specified groups.

When a user uploads a probe the system will tag that probe with the current user and the user's currently selected group. When queries are made to the system, the pipeline will filter out probes that are not tagged with the user's currently selected group.

This tagging will prevent users from viewing probes uploaded by other users that exist in groups where they do not have access.

An admin of the system is responsible for creating these groups and assigning users to them.

See **[here](./tagging.md)** for more information on tagging.

**IF GROUPING IS ENABLED THEN USERS AND THEIR RESPECTIVE GROUPS MUST BE DEFINED IN THE REQUEST HEADERS OR THE CONSOLE WILL BE UNREACHABLE.**

## Grouping Configuration

There are several values that need to be defined or enabled to ensure that the grouping feature is on. The default values can be found **[here](../../server/config/default.json)**.

These values are set either by ENV variables or by mounting a configuration file into the `/config` directory. Environment variable definitions can be view **[here](../../server/config/custom-environment-variables.json).**

**NOTE:`config/default.json` is the default configuration for the application, and can be overwritten by `config/development.json` or `config/production.json`.**

Please see **[config npm](https://github.com/lorenwest/node-config/wiki/Environment-Variables)** for more information on how configuration is organized in this project.

```bash
UI : {
        enableGroups: true,
        unknownUsers: deny,
        enableDelete: true,
        groupPrefix: medifor-uigrp-
        userTagPrefix: user,
        groupTagPrefix: group,
        tagPrefixFlag: __,
        defaultFuserId: ta2-combo,
}
```

### Required config values for grouping

The system configuration values needed for grouping feature are:

- `enableGroups` - Boolean flag to turn grouping on/off
- `unknownUsers` - Indicates how to handle unknown users
- `groupPrefix` - Prefix for groups that are passed in through the headers
- `groupTagPrefix` - Prefix for group tags concatenated with tagPrefixFlag when they are submitted to the pipeline
- `userTagPrefix` - Prefix for user tags concatenated with tagPrefixFlag when they are submitted to the pipeline
- `tagPrefixFlag` - Flag appended to group/username tags so pipeline can distinguish it from user added tags / system-level-media tags

## User Configuration

If the grouping feature is enabled then you MUST provide headers to define the current user and the groups that the user belongs to. Otherwise the user will not be able to access the console, this is a security precaution.

### User values

There are state values used by the client side of the application to enable the grouping feature **[here](../../client/src/store/modules/user.js)**.

These state values are determined by the request headers (selectedGroup defaults to first in groups list). If there are no groups or user provided in the headers, the feature will be unavailable.

```bash
state = {
    name: jdoe,
    selectedGroup: foo,
    groups: [foo, bar, baz],
    displayName: John Doe,
    isAdmin: false
}
```

**Headers Example for the user configuration above**

```bash
usergroups: medifor-uigrp-foo, medifor-uigrp-bar, medifor-uigrp-baz
username: jdoe
displayname: John Doe
```

**All of the group names in the request headers should be prefixed with the groupPrefix defined in the config file.**

### Required user values for grouping

The user state values needed for grouping feature are:

- `groups` - The name of the groups the user is a part of
- `name` - The name of the user currently logged into the system
- `selectedGroup` - The currently selected group for that user (auto-selected on initial load)

![Group dropdown](/docs/images/grouping.png)

## Admin Privileges and Deleting

Administrators to the system have the privilege to delete any uploaded media via the UI (regular users can delete their own uploads).

To have administator access that user must be in the `admin` group via the headers, prefix by the `groupPrefixTag`.

**NOTE: There is a config flag `enableDelete` that permits the deleting feature for regular users which is defaulted to `true`. To override this please pass in an ENV variable or change the config file.**

![Delete Button](/docs/images/delete.png)
