var TabDrawers = Class.create({
    initialize: function(tabsCollection, drawersCollection, options) {
        this.options = Object.extend(Object.extend({ }, TabDrawers.DefaultOptions), options || { });
        
        this.tabsCollection = tabsCollection;
        this.drawersCollection = drawersCollection;
        
        this.tabsCollection.each(function(tabs) {
            tabs.menus.each(function(menu) {
                // Find which drawers is attached to this menu
                this.drawersCollection.each(function(drawers) {
                    // Loop through wrapper, and find wrapper linked to menu
                    drawers.wrappers.each(function(wrapper) {
                        new TabDrawers.Menu(menu, wrapper, drawers, this.options);
                    }.bind(this));
                }.bind(this));                
            }.bind(this));
        }.bind(this));
    }
});

TabDrawers.Menu = Class.create({
    initialize: function(menu, wrapper, drawers, options) {
        this.menu = menu;
        this.wrapper = wrapper;
        this.drawers = drawers;
        this.options = options;
        
        // Loop through tabs and add click events if anchors are part of the wrapper
        this.menu.tabs.each(function(tab) {
            if (tab.anchor.ancestors().include(wrapper)) {
                tab.anchor.observe("click", function(event, tab) {                    
                    // Since we assume only one drawers, then we grab the first tirgger
                    var trigger = this.drawers.triggers[0];
                    var hide = false;
                    
                    // If closeDrawers is true, then check to see if we should close it
                    if (this.options.closeDrawers) {
                        if (this.lastActiveTab == tab) {
                            hide = true;
                            this.lastActiveTab = null;
                        } else {
                            this.lastActiveTab = tab;
                        }
                    }
                    
                    this.drawers.toggleContent.call(this.drawers, trigger, hide, true, true);
                    event.stop();
                }.bindAsEventListener(this, tab));
            }
        }.bind(this));
    }
});

TabDrawers.DefaultOptions = {
    closeDrawers: true
};