# Application caching

## Server-side Caching

We use Catbox for server-side caching. The service always uses CatboxRedis, both locally and when deployed, so the
session cache is consistent across environments.

## Redis

Redis is an in-memory key-value store. Every instance of a service has access to the same Redis key-value store similar
to how services might have a database (or MongoDB). All frontend services are given access to a namespaced prefixed that
matches the service name. e.g. `my-service` will have access to everything in Redis that is prefixed with `my-service`.
