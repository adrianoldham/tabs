Array.prototype.index = function(val) {
    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] == val) return i;
    }

    return null;
};

Array.prototype.include = function(val) {
    return this.index(val) !== null;
};

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
        this.setupAutoPlay();
    },
    
    activate: function() {
        this.menu.tabs.each(function(tab) {
            tab.deactivate();
        });
        
        this.parent.options.animation.activate.call(this);
        this.element.classNames().add(this.parent.options.activeClass);
                
        // Remember which tab is currently active
        this.menu.activeTab = this;

        // Start auto play once activated
        this.startAutoPlay();
    },
    
    deactivate: function() {
        this.parent.options.animation.deactivate.call(this);
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

    startAutoPlay: function() {
        if (!this.parent.options.autoPlay) return;

        this.stopAutoPlay();
        
        this.parent.autoPlayerTimer = setTimeout(function() {
            var nextTab = this.menu.activeTab.nextTab();
            if (nextTab) {
                nextTab.activate();                
            }
        }.bind(this), this.parent.options.autoPlayDelay);
    },
    
    stopAutoPlay: function() {
        if (this.parent.autoPlayerTimer !== null && this.parent.autoPlayerTimer !== undefined) {
            clearTimeout(this.parent.autoPlayerTimer);
        }
    },

    setupAutoPlay: function() {
        var resetAutoPlay = function() {
            this.startAutoPlay();
        }.bind(this);
        
        // If mouse move, then stop the auto play
        this.content.observe('mousemove', resetAutoPlay);
        this.element.observe('mousemove', resetAutoPlay);
    },
    
    previousTab: function() {
        var index = this.menu.tabs.indexOf(this);
        if (index != 0) {
            return this.menu.tabs[index - 1];
        } else {
            return this.menu.tabs[this.menu.tabs.length - 1];
        }
    },
    
    nextTab: function() {
        var index = this.menu.tabs.indexOf(this);
        if (index != this.menu.tabs.length - 1) {
            return this.menu.tabs[index + 1];
        } else {
            return this.menu.tabs[0];
        }
    }
});

Tabs.Menu = Class.create({
    initialize: function(element, parent) {
       this.element = element;
       this.parent = parent;
       this.tabs = [];
       this.initialized = false;
    },

    addTab: function(tab) {
       this.tabs.push(tab);
       tab.menu = this;
    },

    setup: function() {
       if (this.tabs.length == 0) return;
       
       // Setup animations container
       if (this.parent.options.animation != Tabs.Animations.None) {
           
           // Find the first tab content panel
           this.firstTabContent = this.tabs.first().content;
           
           // Use the existing container if available
           this.container = this.firstTabContent.up('.' + this.parent.options.containerClass);
           var containerExists = this.container != null ? true : false;
           
           // Create a new container if none exists
           if (this.container == null) {
               this.container = new Element("div", { "class": this.parent.options.containerClass });
           }
           
           // Find height and width to set the container to
           // Should be the max width and max height of the tabs
           var maxTabContentSize = { width: 0, height: 0 };
           this.tabs.each(function(tab) {
               if (tab.content.offsetWidth > maxTabContentSize.width) {
                   maxTabContentSize.width = tab.content.offsetWidth;
               }
               
               if (tab.content.offsetHeight > maxTabContentSize.height) {
                   maxTabContentSize.height = tab.content.offsetHeight;
               }
           }.bind(this));
           
           if (isNaN(maxTabContentSize.width)) maxTabContentSize.width = 0;
           if (isNaN(maxTabContentSize.height)) maxTabContentSize.height = 0;
           
           // Set container to the size found
           this.container.setStyle({ 
               position: "relative",
               overflow: this.parent.options.containerOverflow,
               width: maxTabContentSize.width + "px",
               height: maxTabContentSize.height + "px"
           });
           
           // Insert the new container before the first tab if it doesn't already exist
           if (!containerExists) {
               this.firstTabContent.insert({ before: this.container });
           }
       }
       
       var tabIndex = 0;
       this.tabs.each(function(tab) {
           // Add tab content into container if container exists
           if (this.container != null) {
               if (!containerExists) {
                   this.container.insert(tab.content);
               }
               
               // Call the animation setup function for the tab
               this.parent.options.animation.setup.call(this, tab);
           }
           
           tab.setupNavigation();
       }.bind(this));

       var idToActivate = null;
       if (window.location.hash.charAt(0) == '#') {
           idToActivate = window.location.hash.substring(1);
       }

       this.tabs.each(function(tab) {
           if (idToActivate !== null && tab.content.id == idToActivate) {
               var duration = this.parent.options.animationOptions.duration;
               this.parent.options.animationOptions.duration = 0;
               tab.activate();
               this.parent.options.animationOptions.duration = duration;
           } else {
               if (!tab.isFirst()) {
                   tab.deactivate();
               } else {
                   tab.activate();
               }   
           }
       }.bind(this));
              
       // Now initialized
       this.initialized = true;
       
       return this;
    }
});

// Supported animations (separate from main code so extra animations can be added easily)
Tabs.Animations = {
    None: {
        setup: function(tab) {
        },
        
        activate: function() {
            this.content.show();
        },
        
        deactivate: function() {
            this.content.hide();
        }
    },
    Fade: {
        setup: function(tab) {
            tab.content.setStyle({
                position: "absolute",
                top: "0px",
                left: "0px"
            });
        },
        
        activate: function() {
            // If not initialized, then quickly show without fade
            if (!this.menu.initialized) {
                this.content.show();
                return;
            }
            
            if (this.latestEffect != null) this.latestEffect.cancel();
            this.latestEffect = new Effect.Appear(this.content, this.parent.options.animationOptions);
        },
        
        deactivate: function() {
            // If not initialized, then quickly hide without fade
            if (!this.menu.initialized) {
                this.content.hide();
                return;
            }
            
            if (this.latestEffect != null) this.latestEffect.cancel();
            this.latestEffect = new Effect.Fade(this.content, this.parent.options.animationOptions);
        }
    },
    Slide: {
        setup: function(tab) {
            var tabIndex = this.tabs.index(tab);
            var containerWidth = this.container.offsetWidth;
            var tabPosition = tabIndex * containerWidth;
            
            if (isNaN(tabPosition) || tabPosition < 0) {
                tabPosition = 0;
            }
            
            tab.content.setStyle({
                position: "absolute",
                top: "0px",
                left: tabPosition + "px"
            });
            
            // Store starting position for use later
            tab.tStartingPosition = tabPosition;
        },
        
        activate: function() {
            var effects = [];
            
            for (var i = 0; i < this.menu.tabs.length; i++) {
                var tab = this.menu.tabs[i];
                var position = tab.tStartingPosition - this.tStartingPosition;
                effects.push(new Effect.Move(tab.content, { x: position, y: 0, mode: 'absolute', sync: true } ));
            }
            
            if (this.menu.latestEffect != null) {
                this.menu.latestEffect.cancel();
            }
            this.menu.latestEffect = new Effect.Parallel(effects, this.parent.options.animationOptions);
        },
        
        deactivate: function() {
        }
    },
    VerticalSlide: {
        setup: function(tab) {
            var tabIndex = this.tabs.index(tab);
            var containerHeight = this.container.offsetHeight;
            var tabPosition = tabIndex * containerHeight;
            
            if (isNaN(tabPosition) || tabPosition < 0) {
                tabPosition = 0;
            }
            
            tab.content.setStyle({
                position: "absolute",
                top: tabPosition + "px",
                left: "0px"
            });
            
            // Store starting position for use later
            tab.tStartingPosition = tabPosition;
        },
        
        activate: function() {
            var effects = [];
            
            for (var i = 0; i < this.menu.tabs.length; i++) {
                var tab = this.menu.tabs[i];
                var position = tab.tStartingPosition - this.tStartingPosition;
                effects.push(new Effect.Move(tab.content, { x: 0, y: position, mode: 'absolute', sync: true } ));
            }
            
            if (this.menu.latestEffect != null) {
                this.menu.latestEffect.cancel();
            }
            this.menu.latestEffect = new Effect.Parallel(effects, this.parent.options.animationOptions);
        },
        
        deactivate: function() {
        }
    }
};

// Supported animations are:
// - Tabs.Animations.None
// - Tabs.Animations.Fade
// - Tabs.Animations.Slide

Tabs.DefaultOptions = {
    animation: Tabs.Animations.None,        // How to animate, null for no animation, "fade" for fade in/out, "slide" for slide in/out
    animationOptions: { duration: 0.5 },    // Options for the animation
    containerClass: "container",            // Animation container class name    
    containerOverflow: "hidden",            // Container overflow hidden/visible?
    
    tabTagName: "li",               // the tag name of the element to apply active/hover classes to
    activeClass: "active",          // active tab class
    hoverClass: "hover",            // hover over tab class
    useNavigation: false,           // inject next/prev buttons or not
    navigationClass: "prevnext",    // class name of the next/prev buttons holder
    previousClass: "prev",          // previous button class
    nextClass: "next",              // next button class
    previousText: "Previous",       // text to display for previous button
    nextText: "Next",               // text to display for next button

    autoPlay: false,                // Scrolls between the tabs using the animation specified
    autoPlayDelay: 3000                // The delay between scrolls
};