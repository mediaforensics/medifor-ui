# Tagging

The Medifor UI system leverages the 'tagging' of uploaded probes to implement a variety of features: user-uploaded media, grouping, filtering etc.

## Tag Types

When a probe is uploaded to the system a detectionRequest object will be created that contains pertinent information about the probe and the tags that will be appended.

```
user_tags : { NicholasCage: 'null', deepfake: 'null' },
tags :  { type: 'image', __user: Jdoe, __group: 'foo}
```

These fields represent *user-added-tags* and *system-level* tags.

* `User-added-tags` - Any tag that the user adds to the probe manually. These tags are simply used in gallery filtering
* `System-level` - Tags added by the system to denote the uploading user, the group the probe was uploaded to and the probe's media type. Note that these tags are considered *mutually inclusive* by the system meaning that if a group is selected and a media type is selected then the relevant probes returned must exist in **both** the media type and the group, not either.