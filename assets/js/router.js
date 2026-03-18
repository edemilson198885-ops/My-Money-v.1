window.MM = window.MM || {};
MM.router = { screens:{}, register:function(name, renderFn){ this.screens[name] = renderFn; }, goTo:function(name){ MM.state.currentScreen = name; MM.app.render(); }, renderCurrent:function(){ var renderFn = this.screens[MM.state.currentScreen]; if(renderFn) renderFn(); } };
