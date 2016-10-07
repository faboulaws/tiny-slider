/**
  * tiny-slider
  * @version 0.5.0
  * @author William Lin
  * @license The MIT License (MIT)
  * @github https://github.com/ganlanyuan/tiny-slider/
  */

var tinySlider = (function () {
  'use strict';

  // get supported property, KEYs
  var TRANSITIONDURATION = gn.getSupportedProp([
        'transitionDuration', 
        'WebkitTransitionDuration', 
        'MozTransitionDuration', 
        'OTransitionDuration'
      ]),
      TRANSFORM = gn.getSupportedProp([
        'transform', 
        'WebkitTransform', 
        'MozTransform', 
        'OTransform'
      ]),
      KEY = {
        ENTER: 13,
        SPACE: 32,
        PAGEUP: 33,
        PAGEDOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40
      };

  function core (options) {
    options = gn.extend({
      container: document.querySelector('.slider'),
      transform: 'horizontal',
      items: 1,
      gutter: 0,
      gutterPosition: 'right',
      edgePadding: 0,
      fixedWidth: false,
      maxContainerWidth: false,
      slideByPage: false,
      controls: true,
      controlsText: ['prev', 'next'],
      controlsContainer: false,
      nav: true,
      navContainer: false,
      arrowKeys: false,
      speed: 250,
      autoplay: false,
      autoplayTimeout: 5000,
      autoplayDirection: 'forward',
      autoplayText: ['start', 'stop'],
      loop: true,
      autoHeight: false,
      responsive: false,
      lazyload: false,
      touch: true,
      rewind: false
    }, options || {});

    // make sure slider container exists
    if (typeof options.container !== 'object' || options.container === null) { 
      return {
        init: function () { return; },
        destory: function () { return; }
      }; 
    }

    // === define and set variables ===
    var transform = options.transform,
        sliderContainer = options.container,
        sliderWrapper = document.createElement('div'),
        slideItems = sliderContainer.children,
        slideCount = slideItems.length,
        slideCountUpdated = slideItems.length,
        gutter = options.gutter,
        gutterPosition = (options.gutterPosition === 'right') ? 'marginRight' : 'marginLeft',
        edgePadding = (options.rewind) ? 0 : options.edgePadding,
        fixedWidth = options.fixedWidth,
        maxContainerWidth = options.maxContainerWidth,
        controls = options.controls,
        controlsText = options.controlsText,
        controlsContainer = (!options.controlsContainer) ? false : options.controlsContainer,
        nav = options.nav,
        navContainer = (!options.navContainer) ? false : options.navContainer,
        arrowKeys = options.arrowKeys,
        speed = (!TRANSITIONDURATION) ? 0 : options.speed,
        autoplay = options.autoplay,
        autoplayTimeout = options.autoplayTimeout,
        autoplayDirection = (options.autoplayDirection === 'forward') ? 1 : -1,
        autoplayText = options.autoplayText,
        rewind = options.rewind,
        loop = (rewind) ? false : options.loop,
        autoHeight = options.autoHeight,
        slideByPage = options.slideByPage,
        lazyload = options.lazyload,
        touch = options.touch,

        sliderId,
        slideWidth,
        cloneCount,
        items = options.items,
        prevButton,
        nextButton,
        allNavs,
        navCount,
        navCountVisible,
        navClicked = -1,
        index = 0,
        running = false,
        domInit = false,
        layoutInit = false,
        resizeTimer,
        ticking = false;

    if (autoplay) {
      var autoplayTimer,
          animationButton,
          animating = false;
    }

    if (touch) {
      var startX = 0,
          startY = 0,
          translateX = 0,
          distX = 0,
          distY = 0,
          run = false;
    }

    // get items, cloneCount, slideWidth, navCountVisible
    var responsive = (fixedWidth) ? false : options.responsive,
        bpKeys = (typeof responsive !== 'object') ? false : Object.keys(responsive),
        bpVals = getMapValues(responsive);

    var getItems = (function () {
      if (!fixedWidth) {
        return function () {
          var itemsTem = options.items,
              ww = document.documentElement.clientWidth;

          if (bpVals) {
            for (var i = 0; i < bpKeys.length; i++) {
              if (ww >= bpKeys[i]) { itemsTem = bpVals[i]; }
            }
          }
          return Math.max(1, Math.min(slideCount, itemsTem));
        };

      } else {
        return function () { return Math.max(1, Math.min(slideCount, Math.floor(sliderWrapper.clientWidth / fixedWidth))); };
      }
    })();

    var getCloneCount = function () {
      if (loop) {
        return slideCount;
      } else if (edgePadding) {
        return 1;
      } else {
        return 0;
      }
    };

    var getSlideWidth = (function () {
      return function () { return (fixedWidth) ? fixedWidth + gutter : (sliderWrapper.clientWidth + gutter - edgePadding * 2) / items; };
    })();

    var getVisibleNavCount = (function () {
      return function (){ return (options.navContainer) ? slideCount : Math.ceil(slideCount / items); };
    })();

    var getCurrent = (function () {
      return function () { return index + cloneCount; };
    })();

    // # DOM initilize
    // 1. add .tiny-content to container
    // 2. wrap container with .tiny-slider
    // 3. add nav and controls if needed, set allNavs, prevButton, nextButton
    // 4. clone items for loop if needed, update childrenCount
    function updateDom() {
      sliderContainer.classList.add('tiny-content', transform);

      // add slider id
      if (sliderContainer.id.length === 0) {
        sliderContainer.id = sliderId = getSliderId();
      } else {
        sliderId = sliderContainer.id;
      }

      // wrap slider with ".tiny-slider"
      sliderWrapper.className = 'tiny-slider';
      gn.wrap(sliderContainer, sliderWrapper);

      // for IE10
      if (navigator.msMaxTouchPoints) {
        sliderWrapper.classList.add('ms-touch');
        sliderWrapper.addEventListener('scroll', ie10Scroll, false);
      }

      // add slide id
      for (var x = 0; x < slideCount; x++) {
        slideItems[x].id = sliderId + 'item' + x;
      }
      items = getItems();
      if (slideCount <= items) { 
        loop = rewind = nav = controls = slideByPage = false;
      }

      // clone items
      cloneCount = getCloneCount();
      if (loop || edgePadding) {
        var fragmentBefore = document.createDocumentFragment(), 
            fragmentAfter = document.createDocumentFragment();

        for (var j = cloneCount; j--;) {
          var cloneFirst = slideItems[j].cloneNode(true),
              cloneLast = slideItems[slideCount - 1 - j].cloneNode(true);

          // remove id from cloned slides
          cloneFirst.id = '';
          cloneLast.id = '';

          fragmentBefore.insertBefore(cloneFirst, fragmentBefore.firstChild);
          fragmentAfter.appendChild(cloneLast);
        }

        sliderContainer.appendChild(fragmentBefore);
        sliderContainer.insertBefore(fragmentAfter, sliderContainer.firstChild);

        slideCountUpdated = sliderContainer.children.length;
        slideItems = sliderContainer.children;
      }

      // add nav
      if (nav) {
        if (!options.navContainer) {
          var navHtml = '';
          for (var i = 0; i < slideCount; i++) {
            navHtml += '<button data-slide="' + i +'" tabindex="-1" aria-selected="false" aria-controls="' + sliderId + 'item' + i +'" type="button"></button>';
          }

          if (autoplay) {
            navHtml += '<button data-action="stop" type="button"><span hidden>Stop Animation</span>' + autoplayText[0] + '</button>';
          }

          navHtml = '<div class="tiny-nav" aria-label="Carousel Pagination">' + navHtml + '</div>';
          gn.append(sliderWrapper, navHtml);

          navContainer = sliderWrapper.querySelector('.tiny-nav');
        }

        allNavs = navContainer.querySelectorAll('[data-slide]');
        navCount = allNavs.length;

        if (!navContainer.hasAttribute('aria-label')) {
          navContainer.setAttribute('aria-label', "Carousel Pagination");
          for (var y = 0; y < navCount; y++) {
            var navTem = allNavs[y];
            navTem.setAttribute('tabindex', '-1');
            navTem.setAttribute('aria-selected', 'false');
            navTem.setAttribute('aria-controls', sliderId + 'item' + y);
          }
        }
      }

      // add controls
      if (controls) {
        if (!options.controlsContainer) {
          gn.append(sliderWrapper, '<div class="tiny-controls" aria-label="Carousel Navigation"><button data-controls="prev" tabindex="-1" aria-controls="' + sliderId +'" type="button">' + controlsText[0] + '</button><button data-controls="next" tabindex="0" aria-controls="' + sliderId +'" type="button">' + controlsText[1] + '</button></div>');

          controlsContainer = sliderWrapper.querySelector('.tiny-controls');
        }

        prevButton = controlsContainer.querySelector('[data-controls="prev"]');
        nextButton = controlsContainer.querySelector('[data-controls="next"]');

        if (!controlsContainer.hasAttribute('tabindex')) {
          controlsContainer.setAttribute('aria-label', 'Carousel Navigation');
          prevButton.setAttribute('aria-controls', sliderId);
          nextButton.setAttribute('aria-controls', sliderId);
          prevButton.setAttribute('tabindex', '-1');
          nextButton.setAttribute('tabindex', '0');
        }
      }

      // add auto
      if (autoplay) {
        if (!navContainer) {
          gn.append(sliderWrapper, '<div class="tiny-nav" aria-label="Carousel Pagination"><button data-action="stop" type="button"><span hidden>Stop Animation</span>' + autoplayText[0] + '</button></div>');
          navContainer = sliderWrapper.querySelector('.tiny-nav');
        }
        animationButton = navContainer.querySelector('[data-action]');
      }

      // dom initilized
      domInit = true;
    }

    // # SETTING UP
    // update layout:
    // update slide container width, margin-left
    // update slides' width
    function updateLayout() {
      // update slider container width
      if (!layoutInit || responsive) {
        sliderContainer.style.width = slideWidth * slideCountUpdated + 'px';
      }

      // update edge padding
      if (edgePadding) {
        var pl = edgePadding;
        if (fixedWidth) {
          var vw = sliderWrapper.clientWidth;            
          pl = (vw - slideWidth * Math.floor(vw / slideWidth) + gutter) / 2;
        }
        if (!layoutInit || fixedWidth) {
          sliderContainer.style.paddingLeft = pl + 'px';
        }
      }

      // update slider container position
      var gap = cloneCount * slideWidth,
          adjust = (gutterPosition === 'marginLeft') ? gutter : 0,
          ml = gap + adjust;
      if (ml !== 0) { sliderContainer.style.marginLeft = - ml + 'px'; }

      // update slide width & margin
      for (var b = slideCountUpdated; b--;) {
        if (!layoutInit || !fixedWidth) {
          slideItems[b].style.width = slideWidth - gutter + 'px';
        }
        if (!layoutInit && gutter !== 0) {
          slideItems[b].style[gutterPosition] = gutter + 'px';
        }
      }

      // layout initilized
      layoutInit = true;
    }

    // check if an image is loaded
    // 1. See if "naturalWidth" and "naturalHeight" properties are available.
    // 2. See if "complete" property is available.
    function imageLoaded(img) {
      if (typeof img.complete === 'boolean') {
        return img.complete;
      } else if (typeof img.naturalWidth === 'number') {
        return img.naturalWidth !== 0;
      }
    }

    function checkImagesLoaded(images) {
      for (var i = images.length; i--;) {
        if (imageLoaded(images[i])) {
          images.splice(i, 1);
        }
      }

      if (images.length === 0) {
        updateContainerHeight();
      } else {
        setTimeout(function () { 
          checkImagesLoaded(images); 
        }, 16);
      }
    } 

    // update container height
    // 1. get the max-height of the visible slides
    // 2. set transitionDuration to speed
    // 3. update container height to max-height
    // 4. set transitionDuration to 0s after transition done
    function updateContainerHeight() {
      var current = getCurrent(), 
          heights = [], 
          maxHeight, 
          adjust = (edgePadding) ? 1 : 0;

      for (var i = slideCountUpdated; i--;) {
        if (i >= current - adjust && i < current + items) {
          heights.push(slideItems[i].offsetHeight);
        }
      }

      maxHeight = Math.max.apply(null, heights);
      if (TRANSITIONDURATION) { sliderContainer.style[TRANSITIONDURATION] = speed / 1000 + 's'; }
      sliderContainer.style.height = maxHeight + 'px';
      running = true;
      
      setTimeout(function () {
        if (TRANSITIONDURATION) { sliderContainer.style[TRANSITIONDURATION] = '0s'; }
        running = false;
      }, speed);
    }

    // set snapInterval (for IE10)
    function setSnapInterval() {
      if (!navigator.msMaxTouchPoints) { return; }
      sliderWrapper.style.msScrollSnapPointsX = 'snapInterval(0%, ' + slideWidth + ')';
    }

    // show or hide nav.
    // doesn't work on customized nav.
    function diaplayNav() {
      for (var i = navCount; i--;) {
        var navTem = allNavs[i];

        if (i < navCountVisible) {
          if (navTem.hasAttribute('hidden')) {
            navTem.removeAttribute('hidden');
          }
        } else {
          if (!navTem.hasAttribute('hidden')) {
            navTem.setAttribute('hidden', '');
          }
        }
      }
    }

    // # RENDER
    function render() {
      // get variables
      items = getItems();
      if (slideCount <= items) { 
        loop = rewind = nav = controls = slideByPage = false;
      }
      slideWidth = getSlideWidth();
      navCountVisible = getVisibleNavCount();

      // initialize
      updateLayout();
      setSnapInterval();
      if (nav && !options.navContainer) { diaplayNav(); }

      translate();
      afterTransform();
    }

    // # REPAINT
    function repaint(indexGap) {
      sliderContainer.setAttribute('aria-busy', 'true');

      setTransitionDuration(indexGap);
      translate();

      setTimeout(function () {
        if (loop) { resetIndexAndContainer(); }
        afterTransform();

        running = false;
        sliderContainer.setAttribute('aria-busy', 'false');
      }, speed * indexGap);
    }

    // AFTER TRANSFORM
    // Things need to be done after a transfer:
    // 1. check index
    // 2. add classes to visible slide
    // 3. disable controls buttons when reach the first/last slide in non-loop slider
    // 4. update nav status
    // 5. lazyload images
    // 6. update container height
    function afterTransform() {
      updateSlideStatus();
      if (nav) { updateNavStatus(); }
      if (controls && !loop) { updateControlsStatus(); }
      if (lazyload) { lazyLoad(); }
      if (autoHeight) { runAutoHeight(); }
    }

    // set transition duration
    function setTransitionDuration(indexGap) {
      if (!TRANSITIONDURATION) { return; }
      sliderContainer.style[TRANSITIONDURATION] = (speed * indexGap / 1000) + 's';
      running = true;
    }

    // make transfer after click/drag:
    // 1. change 'transform' property for mordern browsers
    // 2. change 'left' property for legacy browsers
    function translate() {
      translateX = - slideWidth * index;

      if (TRANSFORM) {
        sliderContainer.style[TRANSFORM] = 'translate3d(' + translateX + 'px, 0, 0)';
      } else {
        sliderContainer.style.left = translateX + 'px';
      }
    }

    // check index after click/drag:
    // if there is not enough room for next transfering,
    // move slide container to a new location without animation
    // |-----|----------|-----|-----|
    // |items|slideCount|items|items|
    function resetIndexAndContainer() {
      var adjust = (edgePadding) ? 1 : 0, leftEdge, rightEdge;

      if (slideByPage) {
        leftEdge = items - cloneCount + 1 + adjust;
        rightEdge = slideCount + cloneCount - items * 2 - 1; // -1: index starts form 0
      } else {
        leftEdge = - cloneCount + 1 + adjust;
        rightEdge = slideCount + cloneCount - items - 2; // -1: index starts from 0
      }

      if (index < leftEdge || index > rightEdge) {
        (index - slideCount >= leftEdge && index - slideCount <= rightEdge) ? index -= slideCount : index += slideCount;

        if (TRANSITIONDURATION) { sliderContainer.style[TRANSITIONDURATION] = '0s'; }
        translate();
      }
    }

    // update slide
    // set aria-hidden
    function updateSlideStatus() {
      for (var i = slideCountUpdated; i--;) {
        var current = getCurrent(), slideTem = slideItems[i];

        if (i >= current && i < current + items) {
          if (!slideTem.hasAttribute('aria-hidden') || slideTem.getAttribute('aria-hidden') === 'true') {
            slideTem.setAttribute('aria-hidden', 'false');
          }
        } else {
          if (!slideTem.hasAttribute('aria-hidden') || slideTem.getAttribute('aria-hidden') === 'false') {
            slideTem.setAttribute('aria-hidden', 'true');
          }
        }
      }
    }

    // set tabindex & aria-selected on Nav
    function updateNavStatus() {
      var navCurrent;
      if (navClicked === -1) {
        var absoluteIndex = (index < 0) ? index + slideCount : (index >= slideCount) ? index - slideCount : index;
        navCurrent = (options.navContainer) ? absoluteIndex : Math.floor(absoluteIndex / items);

        // non-loop & reach the edge
        if (!loop && !options.navContainer) {
          var re=/^-?[0-9]+$/, integer = re.test(slideCount / items);
          if(!integer && index === slideCount - items) {
            navCurrent += 1;
          }
        }
      } else {
        navCurrent = navClicked;
        navClicked = -1;
      }

      for (var i = navCountVisible; i--;) {
        var navTem = allNavs[i];

        if (i === navCurrent) {
          if (navTem.getAttribute('aria-selected') === 'false') {
            navTem.setAttribute('tabindex', '0');
            navTem.setAttribute('aria-selected', 'true');
          }
        } else {
          if (navTem.getAttribute('aria-selected') === 'true') {
            navTem.setAttribute('tabindex', '-1');
            navTem.setAttribute('aria-selected', 'false');
          }
        }
      }
    }

    // set 'disabled' to true to controls when reach the edge
    function updateControlsStatus() {
      var countTem = (edgePadding) ? slideCount + 1 : slideCount;
      if (countTem > items) {
        if (index === 0) {
          prevButton.disabled = true;
          changeFocus(prevButton, nextButton);
        } else {
          prevButton.disabled = false;
        }

        if (!rewind && index === countTem - items) {
          nextButton.disabled = true;
          changeFocus(nextButton, prevButton);
        } else {
          nextButton.disabled = false;
        }
      } else {
        if (index !== 0) {
          index = 0;
          translate();
        }

        prevButton.disabled = true;
        nextButton.disabled = true;
        prevButton.setAttribute('tabindex', '-1');
        nextButton.setAttribute('tabindex', '-1');
        if (prevButton === document.activeElement) { prevButton.blur(); }
        if (nextButton === document.activeElement) { nextButton.blur(); }
      }
    }

    // lazyload
    function lazyLoad() {
      if (!gn.isInViewport(sliderContainer)) { return; }

      var arr = [];
      for(var i = slideCountUpdated; i--;) {
        var base = index + cloneCount - 1;
        if (i >= base && i <= base + items + 1) {
          var imgsTem = slideItems[i].querySelectorAll('.tiny-lazy');
          for(var j = imgsTem.length; j--; arr.unshift(imgsTem[j]));
          arr.unshift();
        }
      }

      for (var h = arr.length; h--;) {
        var img = arr[h];
        if (!img.classList.contains('loaded')) {
          img.src = img.getAttribute('data-src');
          img.classList.add('loaded');
        }
      }
    }

    // check if all visibel images are loaded
    // and update container height if it's done
    function runAutoHeight() {
      // get all images inside visible slider items
      var current = getCurrent(), images = [];

      for (var i = slideCountUpdated; i--;) {
        if (i >= current -1 && i <= current + items) {
          var imagesTem = slideItems[i].querySelectorAll('img');
          for (var j = imagesTem.length; j--;) {
            images.push(imagesTem[j]);
          }
        }
      }

      if (images.length === 0) {
        updateContainerHeight(); 
      } else {
        checkImagesLoaded(images);
      }
    }

    // # ACTIONS
    // on controls click
    function onClickControl(dir) {
      if (!running) {
        dir = (slideByPage) ? dir * items : dir;
        var indexGap = Math.abs(dir),
            countTem = (edgePadding) ? slideCount + 1 : slideCount;

        index = (loop) ? (index + dir) : Math.max(0, Math.min((index + dir), countTem - items));

        repaint(indexGap);
      }
    }

    function onClickControlPrev() {
      onClickControl(-1);
    }

    function onClickControlNext() {
      var countTem = (edgePadding) ? slideCount + 1 : slideCount;

      if(rewind && index === countTem - items){
        onClickControl(- countTem + items);
      }else{
        onClickControl(1);
      }
    }

    // on doc click
    function onClickNav(e) {
      if (!running) {
        var clickTarget = e.target || e.srcElement,
            navIndex;

        while (gn.indexOf(allNavs, clickTarget) === -1) {
          clickTarget = clickTarget.parentNode;
        }

        navClicked = navIndex = Number(clickTarget.getAttribute('data-slide'));

        var indexTem, indexGap;
        indexTem = (options.navContainer) ? navIndex : navIndex * items;
        indexTem = (loop) ? indexTem : Math.min(indexTem, slideCount - items);
        indexGap = Math.abs(indexTem - index);
        index = indexTem;

        repaint(indexGap);
      }
    }

    function startAction() {
      autoplayTimer = setInterval(function () {
        onClickControl(autoplayDirection);
      }, autoplayTimeout);
      animationButton.setAttribute('data-action', 'stop');
      animationButton.innerHTML = '<span hidden>Stop Animation</span>' + autoplayText[1];

      animating = true;
    }

    function stopAction() {
      clearInterval(autoplayTimer);
      animationButton.setAttribute('data-action', 'start');
      animationButton.innerHTML = '<span hidden>Stop Animation</span>' + autoplayText[0];

      animating = false;
    }

    function toggleAnimation() {
      if (animating) {
        stopAction();
      } else {
        startAction();
      }
    }

    function stopAnimation() {
      if (animating) { stopAction(); }
    }

    // 
    function onKeyDocument(e) {
      e = e || window.event;
      if (e.keyCode === KEY.LEFT) {
        onClickControl(-1);
      } else if (e.keyCode === KEY.RIGHT) {
        onClickControl(1);
      }
    }

    // change focus
    function changeFocus(blur, focus) {
      if (typeof blur === 'object' && typeof focus === 'object') {
        if (blur === document.activeElement) {
          blur.blur();
          focus.focus();
        }
      }
    }

    // on key control
    function onKeyControl(e) {
      e = e || window.event;
      var code = e.keyCode,
          curElement = document.activeElement;

      if (code === KEY.LEFT || code === KEY.UP || code === KEY.HOME || code === KEY.PAGEUP) {
        if (curElement !== prevButton && prevButton.disabled !== true) {
          changeFocus(curElement, prevButton);
        }
      }
      if (code === KEY.RIGHT || code === KEY.DOWN || code === KEY.END || code === KEY.PAGEDOWN) {
        if (curElement !== nextButton && nextButton.disabled !== true) {
          changeFocus(curElement, nextButton);
        }
      }
      if (code === KEY.ENTER || code === KEY.SPACE) {
        if (curElement === nextButton) {
          onClickControlNext();
        } else {
          onClickControlPrev();
        }
      }
    }

    // on key nav
    function onKeyNav(e) {
      e = e || window.event;
      var code = e.keyCode,
          curElement = document.activeElement;

      if (code === KEY.LEFT || code === KEY.PAGEUP) {
        if (curElement.getAttribute('data-slide') > 0) {
          changeFocus(curElement, curElement.previousElementSibling);
        }
      }
      if (code === KEY.UP || code === KEY.HOME) {
        if (curElement.getAttribute('data-slide') !== 0) {
          changeFocus(curElement, allNavs[0]);
        }
      }
      if (code === KEY.RIGHT || code === KEY.PAGEDOWN) {
        if (curElement.getAttribute('data-slide') < navCountVisible - 1) {
          changeFocus(curElement, curElement.nextElementSibling);
        }
      }
      if (code === KEY.DOWN || code === KEY.END) {
        if (curElement.getAttribute('data-slide') < navCountVisible - 1) {
          changeFocus(curElement, allNavs[navCountVisible - 1]);
        }
      }
      if (code === KEY.ENTER || code === KEY.SPACE) {
        onClickNav(e);
      }
    }

    // IE10 scroll function
    function ie10Scroll() {
      sliderContainer.style[TRANSITIONDURATION] = '0s';
      sliderContainer.style.transform = 'translate3d(-' + - sliderContainer.scrollLeft() + 'px,0,0)';
    }

    function onPanStart(e) {
      var touchObj = e.changedTouches[0];
      startX = parseInt(touchObj.clientX);
      startY = parseInt(touchObj.clientY);
    }

    function onPanMove(e) {
      var touchObj = e.changedTouches[0];
      distX = parseInt(touchObj.clientX) - startX;
      distY = parseInt(touchObj.clientY) - startY;

      var rotate = toDegree(Math.atan2(distY, distX)),
          panDir = getPanDir(rotate, 15);

      if (panDir === 'horizontal' && running === false) { run = true; }
      if (run) {
        if (TRANSITIONDURATION) { sliderContainer.style[TRANSITIONDURATION] = '0s'; }

        var min = (!loop) ? - (slideCount - items) * slideWidth : - (slideCount + cloneCount - items) * slideWidth,
            max = (!loop) ? 0 : cloneCount * slideWidth;

        if (!loop && fixedWidth) { min = - (slideCount * slideWidth - sliderWrapper.clientWidth); }

        translateX = - index * slideWidth + distX;
        translateX = Math.max(min, Math.min( translateX, max));

        if (TRANSFORM) {
          sliderContainer.style[TRANSFORM] = 'translate3d(' + translateX + 'px, 0, 0)';
        } else {
          sliderContainer.style.left = translateX + 'px';
        }

        e.preventDefault();
      }
    }

    function onPanEnd(e) {
      var touchObj = e.changedTouches[0];
      distX = parseInt(touchObj.clientX) - startX;

      if (run && distX !== 0) {
        e.preventDefault();
        run = false;
        translateX = - index * slideWidth + distX;

        var indexTem,
            min = (!loop) ? 0 : -cloneCount,
            max = (!loop) ? slideCount - items : slideCount + cloneCount - items;

        indexTem = - (translateX / slideWidth);
        indexTem = (distX < 0) ? Math.ceil(indexTem) : Math.floor(indexTem);
        indexTem = Math.max(min, Math.min(indexTem, max));
        index = indexTem;

        repaint(1);
      }
    }

    // # RESIZE
    function onResize() {
      clearTimeout(resizeTimer);

      // update after resize done
      resizeTimer = setTimeout(function () {
        render();
      }, 100);
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          if (lazyload) { lazyLoad(); }
          ticking = false;
        });
      }
      ticking = true;
    }

    // # Event listener
    function domAddEventListener () {
      // add sliderContainer eventListeners
      if (touch) {
        sliderContainer.addEventListener('touchstart', onPanStart, false);
        sliderContainer.addEventListener('touchmove', onPanMove, false);
        sliderContainer.addEventListener('touchend', onPanEnd, false);
        sliderContainer.addEventListener('touchcancel', onPanEnd, false);
      }

      if (controls) {
        if (!loop) { updateControlsStatus(); }

        prevButton.addEventListener('click', onClickControlPrev, false);
        nextButton.addEventListener('click', onClickControlNext, false);
        prevButton.addEventListener('keydown', onKeyControl, false);
        nextButton.addEventListener('keydown', onKeyControl, false);
      }
      
      if (nav) {
        for (var a = allNavs.length; a--;) {
          allNavs[a].addEventListener('click', onClickNav, false);
          allNavs[a].addEventListener('keydown', onKeyNav, false);
        }
      }

      if (autoplay) {
        startAction();
        animationButton.addEventListener('click', toggleAnimation, false);

        if (controls) {
          prevButton.addEventListener('click', stopAnimation, false );
          nextButton.addEventListener('click', stopAnimation, false );
        }

        if (nav) {
          for (var b = 0; b < navCount; b++) {
            allNavs[b].addEventListener('click', stopAnimation, false);
          }
        }
      }

      if (arrowKeys) {
        document.addEventListener('keydown', onKeyDocument, false);
      }

      // on window resize && scroll
      window.addEventListener('resize', onResize, false);
      window.addEventListener('scroll', onScroll, false);
    }
    
    return {
      init: function () {
        updateDom();
        render();
        domAddEventListener();
      },

      // destory
      destory: function () {
        // sliderWrapper
        gn.unwrap(sliderWrapper);
        sliderWrapper = null;

        // sliderContainer
        sliderContainer.classList.remove('tiny-content', transform);
        removeElementsAttrs(sliderContainer, ['id', 'style']);

        // cloned items
        if (loop) {
          for (var j = cloneCount; j--;) {
            slideItems[0].remove();
            slideItems[slideItems.length - 1].remove();
          }
        }

        // Slide Items
        removeElementsAttrs(slideItems, ['id', 'style', 'aria-hidden']);
        sliderId = slideCount = null;

        // controls
        if (controls) {
          if (!options.controlsContainer) {
            controlsContainer.remove();
            controlsContainer = prevButton = nextButton = null;
          } else {
            removeElementsAttrs(controlsContainer, ['aria-label']);
            removeElementsAttrs(controlsContainer.children, ['aria-controls', 'tabindex']);
            removeElementEvents(controlsContainer);
          }
        }

        // nav
        if (nav) {
          if (!options.navContainer) {
            navContainer.remove();
            navContainer = null;
          } else {
            removeElementsAttrs(navContainer, ['aria-label']);
            removeElementsAttrs(allNavs, ['aria-selected', 'aria-controls', 'tabindex']);
            removeElementEvents(navContainer);
          }
          allNavs = navCount = null;
        }

        // auto
        if (autoplay) {
          if (!options.navContainer && navContainer !== null) {
            navContainer.remove();
            navContainer = null;
          } else {
            removeElementEvents(animationButton);
          }
        }

        // remove slider container events at the end
        // because this will make sliderContainer = null
        if (touch) { removeElementEvents(sliderContainer); }

        // remove arrowKeys eventlistener
        if (arrowKeys) {
          document.removeEventListener('keydown', arrowKeys, false);
        }

        // remove window event listeners
        window.removeEventListener('resize', onResize, false);
        window.removeEventListener('scroll', onScroll, false);
      }
    };
  }

  // === Private helper functions === //
  function getSliderId() {
    if (window.tinySliderNumber === undefined) {
      window.tinySliderNumber = 1;
    } else {
      window.tinySliderNumber++;
    }
    return 'tinySlider' + window.tinySliderNumber;
  }

  function toDegree (angle) {
    return angle * (180 / Math.PI);
  }

  function getPanDir(angle, range) {
    if ( Math.abs(90 - Math.abs(angle)) >= (90 - range) ) {
      return 'horizontal';
    } else if ( Math.abs(90 - Math.abs(angle)) <= range ) {
      return 'vertical';
    } else {
      return false;
    }
  }

  function getMapValues (obj) {
    if (typeof(obj) === 'object') {
      var values = [],
          keys = Object.keys(obj);

      for (var i = 0, l = keys.length; i < l; i++) {
        var a = keys[i];
        values.push(obj[a]);
      }

      return values;
    } else {
      return false;
    }
  }

  function removeElementsAttrs(els, attrs) {
    var els = (gn.isNodeList(els)) ? els : [els],
        attrs = (attrs instanceof Array) ? attrs : [attrs],
        attrLength = attrs.length;
    for (var i = els.length; i--;) {
      for (var j = attrLength; j--;) {
        els[i].removeAttribute(attrs[j]);
      }
    }
  }
  function removeElementEvents(el) {
    var elClone = el.cloneNode(true), parent = el.parentNode;
    parent.insertBefore(elClone, el);
    el.remove();
    el = null;
  }

  return core;
})();