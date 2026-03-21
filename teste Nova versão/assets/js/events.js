window.MM = window.MM || {};
MM.events = {
  bindGlobal: function(){
    document.addEventListener('click', function(e){
      var rippleTarget = e.target.closest('.btn,.nav-btn,.movement-card-toggle,.movement-chevron,.quick-pay-btn,.dashboard-link,.mobile-menu-btn');
      if(rippleTarget){ MM.ui.createRipple(rippleTarget, e); }
      var target = e.target.closest('[data-go],[data-toggle-sidebar],[data-close-sidebar]');
      if(!target) return;
      if(target.dataset.toggleSidebar){ MM.ui.toggleSidebar(); return; }
      if(target.dataset.closeSidebar){ MM.ui.closeSidebar(); return; }
      if(target.dataset.go){
        MM.router.goTo(target.dataset.go);
        if(window.innerWidth <= 980){ MM.ui.closeSidebar(); }
      }
    });
  }
};
