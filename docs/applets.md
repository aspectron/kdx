# KDX Applets

KDX provides a miniature framework that enables you to easily create an NWJS window within KDX that has access to KDX configuration.

This is an equivalent to a NodeJs application with a web interface that receives KDX + Kaspa Application Stack configuration on startup.

Applets can be located within the KDX application folder inside `apps` subfolder or symlinked to this location.
Alternatively applets can be configured to run from a custom location via configuration settings.


## Configuration Settings

The following applet configuration settings can should be created inside of KDX module
configuration settings (located in the *Settings tab*) or can be placed inside the `"kdx"`
property of `packaje.json` manifest file if located within the apps folder:

```json
{
    "name": "DAGViz",
    "location": "http://localhost:8689",
    "stop": "http://localhost:8689/stop",
    "width": 1600,
    "height": 680,
    "args": [
      "node",
      "dagviz",
      "--kdx",
      "--no-auth",
      "--port=8689",
      "--kasparov=http://localhost:$KASPAROVD-PORT",
      "--mqtt-address=mqtt://localhost:$MQTT-PORT"
    ]
}
```

The following is a `package.json` sample file:

```json
{
    "name" : "my-app",
    "version" : "1.2.3",
    "kdx" : { 
        "name" : "My App",
        "location" : "http://dagviz.com"
    }
}
```

Supported properties:
- `name` - name of the application
- `location` - URL KDX should open
- `stop` *optional* - URL to signal KDX shutdown
- `width` *optional* - Applet window width
- `height` *optional* - Applet window height
- `args` *optional* - array of command line arguments to spawn at KDX startup
- `advanced` *optional* - this option will cause applet to show up only if *Advanced Settings* option is enabled.
