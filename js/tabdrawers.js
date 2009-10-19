var TabDrawers = Class.create({
    initialize: function(tabsCollection, drawersCollection, options) {
        this.options = Object.extend(Object.extend({ }, Tabs.DefaultOptions), options || { });
        
        this.tabsCollection = tabsCollection;
        this.drawersCollection = drawersCollection;
        
        this.tabsCollection.each(function(tabs) {
            tabs.menus.each(function(menu) {
                // Find which drawers is attached to this menu
                this.drawersCollection.each(function(drawers) {
                    // Loop through wrapper, and find wrapper linked to menu
                    drawers.wrappers.each(function(wrapper) {
                        new TabDrawers.Menu(menu, wrapper, drawers);
                    }.bind(this));
                }.bind(this));                
            }.bind(this));
        }.bind(this));
    }
});

TabDrawers.Menu = Class.create({
    initialize: function(menu, wrapper, drawers) {
        this.menu = menu;
        this.wrapper = wrapper;
        this.drawers = drawers;
        
        // Loop through tabs and add click events if anchors are part of the wrapper
        this.menu.tabs.each(function(tab) {
            if (tab.anchor.ancestors().include(wrapper)) {
                tab.anchor.observe("click", function(event) {
                    // Since we assume only one drawers, then we grab the first tirgger
                    var trigger = this.drawers.triggers[0];
                    this.drawers.toggleContent.call(this.drawers, trigger, false, true, true);
                    event.stop();
                }.bindAsEventListener(this));
            }
        }.bind(this));
    }
});

TabDrawers.DefaultOptions = {
};