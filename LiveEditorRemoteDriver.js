/*
 * Copyright (c) 2013 Adobe Systems Incorporated.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

(function() {
        
        // Hash with available editors for given properties.
        // @see _registerProvider()
    var _providers = {},
        // current active editor for model.property
        _activeEditor = null,
        // element matched by model.selector
        _target = null,
        /* 
            Hash with selector, CSS property and value.
            Will be updated by _setup() and _onValueChange()
            Will be synced to Brackets via _getModel() to update text in code editor.
            @example {selector: 'body', property: 'shape-inside', value: 'circle()' }
        */
        _model = null;
    
    /*
        Setup an editor for a specific CSS property of an element using data in model.
        Editors must be registered with _registerProvider()
        
        @param {Object} model Hash with data:
            {
                // selector to match an element for editing
                selector: {String},
                
                // CSS property to edit
                property: {String},
                
                // Initial value for editor
                value: {String}
            }
    */
    function _setup(model){
        if (!model || !model.property || !model.selector){
            console.error('model is funky: ' + JSON.stringify(model));
        }
        
        if (!_providers[model.property]){
            console.warn('no editor provided for property: ' + model.property);
            return;
        }
        
        // find the first matching element from the given selector
        // TODO: implement querySelectorAll() navigation through multiple results
        _target = document.querySelector(model.selector);
        
        if (!_target){
            console.warn('no element matching selector: ' + model.selector);
            return;
        }
        
        // reset everything
        // _remove();
        
        // store the data from Brackets editor
        _model = model;
        
        // get an editor that can handle the property
        _activeEditor = new _providers[model.property];
        _activeEditor.setup(_target, model);
        
        // sync the element's style and the model value
        _activeEditor.onValueChange(_onValueChange);
    }
    
    function _onValueChange(value){
        if (!_target || !value){
            return
        }
        
        // update the selector target's style
        _target.style[_model.property] = value;
        
        // remove the polygon fill-rule until CSSUtils.getInfoAtPos() is fixed
        // @see https://github.com/adobe/brackets/pull/6568
        value = /^polygon/.test(value) ? value.replace(/nonzero,\s*/, '') : value;
        
        // update the model. will be requested by Brackets to sync code editor
        _model.value = value;
    }
    
    function _remove(){
        if (_activeEditor){
            _activeEditor.remove();
            _activeEditor = null;
        }
        
        _model = null;
    }
    
    function _update(model){
        _activeEditor.update(model);
    }
    
    function _getModel(){
        return JSON.stringify(_model);
    }
    
    /*
        Register an editor for the given CSS property.
        This allows support for custom editors for any CSS property.
        
        Editor will be invoked if the given property 
        matches model.property in _LD_CSS_EDITOR.setup(model).
        
        @param {String} property CSS property
        @param {Object} editor Handler for the property.
        
        Provided editors MUST implement the follwing interface:
        {   
            // turn on editor on specified target HTMLElement. 
            // picks-up necessary args from model
            setup: function(target, model){},
            
            // update the editor state given the provided model
            update: function(model){},
            
            // turn off the editor and remove any scaffolding
            remove: function(){},
            
            // sets a callback to be called with the new value
            onValueChange: function(callback){}
        }
    */
    function _registerProvider(property, editor){
        // TODO: check for interface conformity
        _providers[property] = editor;
    }
    
    window._LD_CSS_EDITOR = {
        setup: _setup,
        
        remove: _remove,
        
        update: _update,
        
        getModel: _getModel,
        
        registerProvider: _registerProvider
    };
    
})();
