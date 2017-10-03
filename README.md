Texturity.js
===
WebGL based library for fast drawing textures

### Capabilities

- Normal map
- Blur
- Noise
- Repeat
- Circle
- Brick wall
- Gradient
- Blending
- Image drawing
- Convolution
- Fourier transormation

### Installing

Download the [latest release](https://github.com/ni55an/texturity.js/releases/latest) or use directly from [Surge](https://surge.sh):

````html
<script src="https://texturity-js.surge.sh/texturity.js"></script>
````

### Usage

Optionally initialize the WebGL context

```js
 Texturity.initGL('webgl',{alpha:true}); //optional parameters
```

Create and process Canvas

```js
var fastCanvas = new Texturity.Canvas(w, h);

fastCanvas.drawCircle(0.5);
fastCanvas.drawBricks(6,0.05);
fastCanvas.blur(fastCanvas.toTexture(), 3);
fastCanvas.normalMap(fastCanvas.toTexture(), 0.5,0,4);
```

 All Canvas instances use the same WebGL context, which allows to get good performance, so be careful and use `save()/restore()`


