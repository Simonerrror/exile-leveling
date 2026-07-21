# Map-name loading design

The map-name shard is already small (about 30 KB raw in Russian); the perceived delay came from waiting for both the lazy workspace chunk and its data request after navigation. The catalog now warms the localized map-name shard during idle time and immediately on pointer or keyboard focus. The route remains lazy and the data remains outside the initial/PWA precache bundle. Success means the localized list is present on the first post-navigation snapshot without a visible loading pause.
