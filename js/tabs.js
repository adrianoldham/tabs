var Tabs = Class.create({
    initialize: function(selector, options) {
        this.options = Object.extend(Object.extend({ }, Tabs.DefaultOptions), options || { });
        
        this.anchors = $$(selector);
        this.setupMenus();        
    },
    
    setupMenus: function() {
        var currentMenuElement = null;
        var currentMenu = null;
        
        this.menus = [];
        
        this.anchors.each(function(anchor) {
            var tabElement = this.findTabElementFromAnchor(anchor);
            
            previousMenuElement = currentMenuElement;
            currentMenuElement = $(tabElement.parentNode);
            
            // if menu has changed, then create it
            if (previousMenuElement != currentMenuElement) {
                if (currentMenu != null) this.menus.push(currentMenu.setup());                
                currentMenu = new Tabs.Menu(currentMenuElement, this);
            }
            
            // add tab to the current menu
            currentMenu.addTab(new Tabs.Tab(tabElement, anchor, this));
        }.bind(this));

        if (currentMenu != null) this.menus.push(currentMenu.setup());
    },

    findTabElementFromAnchor: function(anchor) {
        var element = anchor;
        
        while (element && element.tagName.toUpperCase() != this.options.tabTagName.toUpperCase()) { element = $(element.parentNode); }

        return element;
    }
});

Tabs.Tab = Class.create({
    initialize: function(element, anchor, parent) {
        this.element = element;
        this.anchor = anchor;
        this.parent = parent;
        this.content = $(anchor.href.substring(anchor.href.lastIndexOf("#") + 1));
        
        this.setupAnchor();
    },
    
    activate: function() {
        this.menu.tabs.each(function(tab) {
            tab.deactivate();
        });
        
        this.content.show();
        this.element.classNames().add(this.parent.options.activeClass);
    },
    
    deactivate: function() {
        this.content.hide();
        this.element.classNames().remove(this.parent.options.activeClass);
    },
    
    setupAnchor: function() {
        this.anchor.observe("click", function(event) {
            this.activate();
            event.stop();
        }.bindAsEventListener(this));
        
        this.anchor.observe("mouseover", function() {
            this.element.classNames().add(this.parent.options.hoverClass);
        }.bind(this));
        
        this.anchor.observe("mouseout", function() {
            this.element.classNames().remove(this.parent.options.hoverClass);
        }.bind(this));
    },
    
    isFirst: function() {
        return this == this.menu.tabs[0];
    },
    
    isLast: function() {
        return this == this.menu.tabs.last();
    },

    setupNavigation: function() {
        if (!this.parent.options.useNavigation) return;
        
        var ulElement = new Element("ul", { "class": this.parent.options.navigationClass });

        if (!this.isFirst()) {
            var prevElement = new Element("li", { "class": this.parent.options.previousClass });
            prevElement.innerHTML = this.parent.options.previousText;
            
            prevElement.observe("click", function() {
                this.previousTab().activate();
            }.bind(this));
            
            ulElement.appendChild(prevElement);
        }
        
        if (!this.isLast()) {
            var nextElement = new Element("li", { "class": this.parent.options.nextClass });
            nextElement.innerHTML = this.parent.options.nextText;
            
            nextElement.observe("click", function() {
                this.nextTab().activate();
            }.bind(this));
            
            ulElement.appendChild(nextElement);
        }
        
        this.content.appendChild(ulElement);
    },
    
    previousTab: function() {
        var index = this.menu.tabs.indexOf(this);
        if (index != 0) return this.menu.tabs[index - 1];
    },
    
    nextTab: function() {
        var index = this.menu.tabs.indexOf(this);
        if (index != this.menu.tabs.length - 1) return this.menu.tabs[index + 1];
    }
});

Tabs.Menu = Class.create({
    initialize: function(element, parent) {
       this.element;
       this.parent;
       this.tabs = [];
    },

    addTab: function(tab) {
       this.tabs.push(tab);
       tab.menu = this;
    },

    setup: function() {
       if (this.tabs.length == 0) return;
       
       this.tabs.each(function(tab) {
           if (!tab.isFirst()) {
               tab.deactivate();
           } else {
               tab.activate();
           }
           
           tab.setupNavigation();
       }.bind(this));
       
       return this;
    }
});

Tabs.DefaultOptions = {
    tabTagName: "li",               // the tag name of the element to apply active/hover classes to
    activeClass: "active",          // active tab class
    hoverClass: "hover",            // hover over tab class
    useNavigation: false,           // inject next/prev buttons or not
    navigationClass: "prevnext",    // class name of the next/prev buttons holder
    previousClass: "prev",          // previous button class
    nextClass: "next",              // next button class
    previousText: "Previous",       // text to display for previous button
    nextText: "Next"        // text to display for next button
};