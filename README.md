# Rutas
Rutas - A lightweight route file generator for the [QuickRouteMap](https://github.com/dpm76/QuickRouteMap) app.

## Local Development Server

To test and develop the application locally, two scripts are provided in the root of the project to manage a local web server:

*   **`./app-init [port]`**: Starts a local web server (serving the content of `WebContent`). By default, it runs on port `8000`, but you can pass a custom port as a parameter. Run with `-h` or `--help` to see the help menu.
*   **`./app-stop`**: Stops the local web server.

### Why use the scripts instead of opening `index.html` directly?

If you open the `index.html` file directly in your browser using the local file protocol (`file://...`):
1.  **Map blocking (403 Error)**: Security policies of modern browsers remove or restrict the HTTP `Referer` header when making external requests from local files (`file://`).
2.  **OpenStreetMap Policy**: The OpenStreetMap (OSM) server strictly requires all map requests to include a valid `Referer` header to prevent abuse or massive automated downloads. Without this header, OSM will block the loading of maps, showing a "403 Forbidden" error ("Access blocked").

By using `./app-init` to start the local server, the browser accesses the application through `http://localhost:8000/`. This allows the browser to send the correct `Referer` header (`Referer: http://localhost:8000/`), ensuring that OpenStreetMap images load successfully.

### Execution steps:

1.  Start the server from the terminal (optionally specifying a custom port):
    ```bash
    ./app-init [port]
    ```
2.  Access the application in your browser at `http://localhost:<port>` (e.g., [http://localhost:8000](http://localhost:8000)).
3.  *(Optional)* If you previously saw 403 errors, remember to clear the browser cache (or use incognito mode) to prevent cached erroneous tiles from loading.
4.  When you finish using it, stop the server:
    ```bash
    ./app-stop
    ```
