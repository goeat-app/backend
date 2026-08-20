# Image Fetching Memory Optimization Spec

## Objective

Optimize restaurant image fetching in the Cloud Functions to
significantly reduce memory usage and avoid memory spikes when
processing multiple restaurant images concurrently.

The implementation should preserve the current behavior and storage flow
while changing how images are downloaded, processed, and uploaded.

## Requirements

### 1. Stream images directly into Cloud Storage

Update `PlacesProvider.getAndSaveImageByName()` so images are **streamed
from Google Places directly into the Storage bucket** instead of being
fully loaded into memory.

Current behavior:

``` text
Google Places
    ↓
Axios ArrayBuffer
    ↓
Buffer
    ↓
Storage
```

Required behavior:

``` text
Google Places
    ↓
Axios Readable Stream
    ↓
Cloud Storage Write Stream
```

#### Implementation requirements

-   Change the Axios request from `responseType: 'arraybuffer'` to
    `responseType: 'stream'`.
-   Do not call `Buffer.from()`.
-   Do not load the complete image into memory.
-   Update `storageService.uploadFile()` to support a Node.js `Readable`
    stream.
-   When receiving a stream, pipe the input stream into the Storage
    write stream.
-   Preserve the existing content type detection.
-   Preserve the existing storage path and returned storage path.
-   Properly propagate errors from both the download stream and Storage
    upload stream.
-   Ensure the HTTP response stream is properly consumed/closed when
    errors occur.
-   Existing Buffer-based `uploadFile()` behavior should remain
    supported if the method is used elsewhere with Buffers.

### 2. Limit image processing concurrency with `p-limit`

The current implementation uses unbounded `Promise.all()` when
processing restaurant images.

Replace this with `p-limit` using a **concurrency limit of 5**.

Use:

``` ts
import pLimit from 'p-limit';
```

Create a limiter with:

``` ts
const limit = pLimit(5);
```

Apply it to image processing in:

-   `getNewRestaurantsUpdated()`
-   `syncExistingRestaurantsImage()`

The desired behavior is:

``` text
Restaurant 1 ──┐
Restaurant 2 ──┤
Restaurant 3 ──┤
Restaurant 4 ──┤── max 5 concurrent image operations
Restaurant 5 ──┘

Restaurant 6+
     ↓
   queued
```

Do not simply replace `Promise.all()` with sequential processing.
Parallelism should be preserved while limiting the maximum number of
concurrent operations to 5.

The limiter should encompass the full image operation, including:

1.  Fetching the Google Places image.
2.  Streaming it to Storage.
3.  Updating the restaurant record.

### 3. Cap Google Places image width at 1080px

The image request must never request an image wider than **1080px**.

The provider currently receives `widthPx` from the selected Google
Places photo. This value can be larger than necessary.

Define:

``` ts
const MAX_IMAGE_WIDTH = 1080;
```

When `widthPx` is provided, use:

``` ts
Math.min(widthPx, MAX_IMAGE_WIDTH)
```

Examples:

``` text
widthPx = 500   → maxWidthPx=500
widthPx = 1080  → maxWidthPx=1080
widthPx = 2000  → maxWidthPx=1080
widthPx = 4032  → maxWidthPx=1080
```

If neither `widthPx` nor `heightPx` is provided, request:

``` text
maxWidthPx=1080
```

The provider should therefore never request an image with
`maxWidthPx > 1080`.

## Expected Architecture

After the changes, image processing should work approximately like this:

``` text
Restaurant Discovery
        │
        ▼
Find restaurants
        │
        ▼
Fetch details
        │
        ▼
Select restaurant photos
        │
        ▼
p-limit(5)
        │
        ├──────────────┐
        ▼              ▼
   Restaurant A    Restaurant B
        │              │
        ▼              ▼
 Google Places     Google Places
   stream            stream
        │              │
        ▼              ▼
 Cloud Storage     Cloud Storage
        │              │
        ▼              ▼
 Update DB         Update DB
```

At no point should the complete image be represented as a `Buffer`.

## Files/Components Expected to Change

The agent should identify the exact implementations in the codebase, but
expect changes around:

-   `PlacesProvider.getAndSaveImageByName()`
-   `storageService.uploadFile()`
-   `RestaurantDiscoverySyncService.getNewRestaurantsUpdated()`
-   `RestaurantDiscoverySyncService.syncExistingRestaurantsImage()`
-   Package dependencies for `p-limit`

## Acceptance Criteria

-   [ ] Images are downloaded using Axios streams.
-   [ ] Images are streamed directly into Cloud Storage.
-   [ ] No `ArrayBuffer` is created for the image.
-   [ ] No `Buffer.from(response.data)` is used for image downloads.
-   [ ] `storageService.uploadFile()` supports streams.
-   [ ] Existing Buffer-based callers of `uploadFile()` continue
    working.
-   [ ] Image processing has a maximum concurrency of **5**.
-   [ ] Both new and existing restaurant image synchronization use the
    concurrency limiter.
-   [ ] Google Places requests never use `maxWidthPx` greater than
    **1080**.
-   [ ] Default image width is **1080px** when no dimensions are
    supplied.
-   [ ] Existing error handling and logging remain intact.
-   [ ] Existing storage paths and database behavior remain unchanged.
-   [ ] TypeScript compilation passes.
-   [ ] Existing tests pass.
-   [ ] Add or update tests covering stream uploads, width limiting, and
    concurrency limiting where the project's testing setup supports it.

## Non-goals

Do not change:

-   Restaurant discovery behavior.
-   Google Places search parameters.
-   Restaurant selection logic.
-   Photo selection logic.
-   Database schema.
-   Storage path structure.
-   Image format/content-type handling.
-   The returned `image_url` behavior.

The goal is specifically to **reduce memory consumption and control
image-fetch concurrency without changing the application's functional
behavior**.
