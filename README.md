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
- etc (coming soon)

### Usage

Optionally initialize the WebGL context

```js
 Texturity.Canvas.initGL(0, 0);
```

Create and process Canvas

```js
var fastCanvas = new Texturity.Canvas(textureSize, textureSize);

fastCanvas.drawCircle(0.5);
fastCanvas.drawBricks(6,0.05);
fastCanvas.blur(await fastCanvas.toImage(), 3);
fastCanvas.normalMap(await fastCanvas.toImage(), 0.5,0,4);
```

 All Canvas instances use the same WebGL context, which allows to get good performance, so be careful and use `save()/restore()`


