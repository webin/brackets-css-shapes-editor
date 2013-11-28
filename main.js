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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function (require, exports, module) {
    "use strict";

    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        CSSUtils            = brackets.getModule("language/CSSUtils"),
        LiveDevelopment     = brackets.getModule("LiveDevelopment/LiveDevelopment"),
        Inspector           = brackets.getModule("LiveDevelopment/Inspector/Inspector"),
        Model               = require("Model");

    var EditorDriver        = require('text!EditorDriver.js'),
        CSSShapesEditor     = require('text!lib/CSSShapesEditor.js');
        
    // Constants
    var SUPPORTED_PROPS = ['shape-inside', 'shape-outside', 'clip-path'];
    var currentEditor = EditorManager.getActiveEditor();
    var model = new Model({
        'property': null,
        'value': null,
        'selector': null
    });
    
    model.on('change', function(e){
        console.log('the change is here', e);
    })
    
    // some callbacks
    var onEditorChanged = function() {
        
        // clean old hooks
        if(currentEditor) { 
            $(currentEditor).off("cursorActivity", _selectionChange) 
            $(currentEditor).off("change", _contentChange) 
        }
        
        // update the values
        currentEditor = EditorManager.getActiveEditor();
        // resetLivePreview();
        
        // add new hooks
        if(currentEditor) { 
            $(currentEditor).on("cursorActivity", _selectionChange)
            $(currentEditor).on("change", _contentChange) 
        }
        
    }
    
    var _selectionChange = function(e){
        var editor = e.target,
            doc = editor.document,
            selection = editor.getSelection(),
            selector, info;
        
        // Get the context info at the selection position
        info = CSSUtils.getInfoAtPos(editor, selection.start);
        
        // Looking just for the context of a CSS property value
        if (info.context !== CSSUtils.PROP_VALUE){
            return;
        }
        
        if (SUPPORTED_PROPS.indexOf(info.name) < 0){
            // check if the end of the selection is on the property value
            info = CSSUtils.getInfoAtPos(editor, selection.end)
        }

        if (SUPPORTED_PROPS.indexOf(info.name) < 0){
            // not the property we're looking for
            return;
        }
        
        // TODO: fix CSSUtils.findSelectorAtDocumentPos() because
        // it matches selectors outside <style> when run on single declaration block in <style> element
        selector = CSSUtils.findSelectorAtDocumentPos(currentEditor, selection.start);
        
        if (!selector || typeof selector !== 'string'){
            return;
        }
        
        var oldSelector = model.get('selector');
        model.set('selector', selector, true);
        model.set('property', info.name, true);
        model.set('value', info.values.join(''), false);
    }

    var _contentChange = function(){
        console.warn('content')
    }
    
    $(EditorManager).on("activeEditorChange", onEditorChanged);
	onEditorChanged();
    
    // setups the live editor with the current model
    // function _setupLiveEditor(){
    //     console.log('wat!!!');
    // 
    //     var expr = '_LD_CSS_EDITOR.start("OPREAAA")';
    //     
    //     Inspector.Runtime.evaluate("('_LD_CSS_EDITOR' in window)")
    //         .then(function(v) {
    //             console.log('res', v)
    //         })
    //     
    //     return Inspector.Runtime.evaluate(expr)
    // }
    // 
    // // updates the live editor with the current model
    // function _updateLiveEditor(){}
    // 
    // // turns off any active live editor
    // function _stopLiveEditor(){}
    // 
    // // syncs current model with that of the live editor
    // function _syncWithLiveEditor(){}
    // 
    function _injectLiveEditorDriver(){
        var script = [EditorDriver, CSSShapesEditor].join(';');
        return Inspector.Runtime.evaluate(script)
    } 
        
    // load those scripts into the page
    function onStatusChange(event, status) {
        if (status >= LiveDevelopment.STATUS_ACTIVE) {
            _injectLiveEditorDriver();
        }
    }
    
    $(LiveDevelopment).on("statusChange", onStatusChange);
    
});
