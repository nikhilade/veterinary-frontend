# Debugging Session Summary

## 1. File Upload Issues (Resolved)
- The backend lacked explicit `multipart` file size limits, causing it to fall back to the Spring Boot 1MB default. 
- You manually updated `D:\koderz\Vet\Backend\veternaryBE\src\main\resources\application.properties` with the provided `max-file-size` limits (10MB) to fix the `500 INTERNAL_SERVER_ERROR` and Connection Reset errors.

## 2. Token Refresh Logic (Resolved)
- **The Problem:** The access token expires every 15 minutes, causing a `401 Unauthorized`. The frontend was not using the stored `refreshToken` to silently request a new access token, leading to forced logouts.
- **What We Did:** 
  - Added an interceptor in `src/lib/api-client.ts` to catch `401 Unauthorized` responses.
  - The interceptor pauses queued requests and sends a background request to `/api/auth/refresh`.
  - Discovered and fixed a bug where a non-JSON 401 error response would instantly throw an exception, completely bypassing the refresh logic.
  - The token refresh now works seamlessly in the background!
