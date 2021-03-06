# Examples
#### Responsive
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 1,
    responsive: {
      500: 2,
      800: 3,
    }
  });
  slider.init();
});
```

#### Fixed width items
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    fixedWidth: 200,
    maxContainerWidth: 900
  });
  slider.init();
});
```

#### Non-loop
Loop is `true` by default.
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    loop: false
  });
  slider.init();
});
```
#### Customize
```html
<div class="slider">
</div>

<!-- customized nav & dots -->
<!-- Attributes [data-controls], [data-slide] and [data-action] are required -->
<div class="controls">
  <button data-controls="prev"></button>
  <button data-controls="next"></button>
</div>
<div class="thumbnails">
  <button data-slide="0"></button>
  <button data-slide="1"></button>
  <button data-slide="2"></button>
  <button data-slide="3"></button>
  <button data-action="stop">stop</button>
</div>
```
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    controlsContainer: document.querySelector('.controls'),
    navContainer: document.querySelector('.thumbnails')
  });
  slider.init();
});
```

#### Lazyload
Add a placeholder image to the image `src` attribute, save the real image sourse in the `data-src` attribute, then add class `tiny-lazy`. 
```html
<!-- class .tiny-lazy is required -->
<div class="slider">
  <div><img src="data:image/gif;base64,R0lGODlhAQABAPAAAMzMzAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="path/to/img.jpg" alt="" class="tiny-lazy" width="300" height="300"></div>
  <div><img src="data:image/gif;base64,R0lGODlhAQABAPAAAMzMzAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="path/to/img.jpg" alt="" class="tiny-lazy" width="300" height="300"></div>
  <div><img src="data:image/gif;base64,R0lGODlhAQABAPAAAMzMzAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="path/to/img.jpg" alt="" class="tiny-lazy" width="300" height="300"></div>
  <div><img src="data:image/gif;base64,R0lGODlhAQABAPAAAMzMzAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="path/to/img.jpg" alt="" class="tiny-lazy" width="300" height="300"></div>
  <div><img src="data:image/gif;base64,R0lGODlhAQABAPAAAMzMzAAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="path/to/img.jpg" alt="" class="tiny-lazy" width="300" height="300"></div>
</div>
```
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    lazyload: true
  });
  slider.init();
});
```

#### Slide by page
Default setting is slide by item.
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    slideByPage: true
  });
  slider.init();
});
```

#### Autoplay
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    autoplay: true,
    autoplayDirection: 'forward',
    speed: 300,
    autoplayTimeout: 3000
  });
  slider.init();
});
```

#### Arrow keys
Run slider by pressing left or right arrow key.
```javascript
var slider = tinySlider({
  container: document.querySelector('.slider'),
  items: 3,
  arrowKeys: true
});
slider.init();
```

#### Auto height
```javascript
gn.ready(function () {
  var slider = tinySlider({
    container: document.querySelector('.slider'),
    items: 3,
    autoHeight: true
  });
  slider.init();
});
```