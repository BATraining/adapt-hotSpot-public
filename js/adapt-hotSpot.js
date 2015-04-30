/*
 * adapt-hotSpot
 * License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
 * Maintainers - Amruta Thakur <amruta.thakur@exultcorp.com>
 */
define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    var HotSpot = QuestionView.extend({

        initialize: function() {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(this.model, 'change:_isVisible', this.toggleVisibility);
            //this.model.set('_globals', Adapt.course.get('_globals'));
            this.setupQuestion();
            if (Adapt.device.screenSize == 'large') {
                this.render();
            } else {
                this.reRender();
            }
        },

        events: {
            "click .hotSpot-item": 'onItemSelected'
        },

        // should be used instead of preRender
        setupQuestion: function() {
            // Check if items need to be randomised
            this.listenTo(Adapt, 'device:changed', this.reRender, this);
            if (this.model.get('_isRandom') && this.model.get('_isEnabled')) {
                this.model.set("_items", _.shuffle(this.model.get("_items")));
            }
        },

        // used just like postRender is for presentational components
        onQuestionRendered: function() {
            //Check if image is loaded
            this.$('.hotSpot-background-image').imageready(_.bind(function() {
                this.setReadyStatus();
            }, this));
        },

        // Used by question to disable the question during submit and complete stages
        disableQuestion: function() {
        },

        // Used by question to enable the question during interactions
        enableQuestion: function() {
        },

        // Used by the question to reset the question when revisiting the component
        resetQuestionOnRevisit: function() {
            this.resetQuestion();
        },

        onItemSelected: function(event) {
            if(event && event.preventDefault) event.preventDefault();

            if (this.model.get('_isEnabled') && !this.model.get('_isSubmitted')) {
                var $hotSpotItem = $(event.currentTarget);
                var hotSpotItemIndex = $hotSpotItem.index();
                var isHotSpotItemSelected = $hotSpotItem.hasClass('selected');
                var selectedHotSpotItem = this.model.get('_items')[hotSpotItemIndex - 1];

                if(isHotSpotItemSelected) {
                    $hotSpotItem.removeClass('selected');
                    selectedHotSpotItem._isSelected = false;
                } else {
                    if (this.model.get('_selectable') === 1) {
                        this.$('.hotSpot-item').removeClass('selected')
                    }

                    $hotSpotItem.addClass('selected');
                    selectedHotSpotItem._isSelected = true;
                }
            }
        },

        // Used by the question view to reset the look and feel of the component.
        // This could also include resetting item data
        resetQuestion: function() {
            this.deselectAllItems();
            this.resetItems();
        },

        deselectAllItems: function() {

            _.each(this.model.get('_items'), function(item) {
                item._isSelected = false;
                item._isCorrect = false;
            });
        },

        resetItems: function() {
            this.$('.hotSpot-widget').addClass('before-submit');
            this.$('.hotSpot-item').removeClass('selected not-selected correct incorrect');

            this.model.set({
                _isAtLeastOneCorrectSelection: false
            });
        },

        // Use to check if the user is allowed to submit the question
        // Should return a boolean
        canSubmit: function() {
            var count = 0;

            _.each(this.model.get('_items'), function(item) {
                if (item._isSelected) {
                    count++;
                }
            }, this);

            var canSubmit = count > 0;
            alert(canSubmit);
            if(canSubmit) {
                this.$('.hotSpot-widget').removeClass('before-submit');
            }

            return canSubmit;
        },

        // Blank method for question to fill out when the question cannot be submitted
        onCannotSubmit: function() {},

        // This is important for returning or showing the users answer
        // This should preserve the state of the users answers
        storeUserAnswer: function() {
        },

        // Should return a boolean based upon whether to question is correct or not
        isCorrect: function() {
            var numberOfRequiredAnswers = 0;
            var numberOfCorrectAnswers = 0;
            var numberOfIncorrectAnswers = 0;
            _.each(this.model.get('_items'), function(item, index) {
                // Set item._isSelected to either true or false
                var itemSelected = (item._isSelected || false);
                if (item._shouldBeSelected) {
                    // Adjust number of correct items
                    numberOfRequiredAnswers++;
                    if (itemSelected) {
                        // If the item is selected adjust correct answer
                        numberOfCorrectAnswers++;
                        // Set item to correct - is used for returning to this component
                        item._isCorrect = true;
                        // Set that at least one correct answer has been selected
                        // Used in isPartlyCorrect method below
                        this.model.set('_isAtLeastOneCorrectSelection', true);
                    }
                } else if (!item._shouldBeSelected && itemSelected) {
                    // If an item shouldn't be selected and is selected
                    // Adjust incorrect answers
                    numberOfIncorrectAnswers++;
                }
            }, this);
            this.model.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);
            this.model.set('_numberOfRequiredAnswers', numberOfRequiredAnswers);
            // Check if correct answers matches correct items and there are no incorrect selections
            var answeredCorrectly = (numberOfCorrectAnswers === numberOfRequiredAnswers) && (numberOfIncorrectAnswers === 0);
            return answeredCorrectly;
        },

        // Used to set the score based upon the _questionWeight
        setScore: function() {
            var questionWeight = this.model.get("_questionWeight");
            var answeredCorrectly = this.model.get('_isCorrect');
            var score = answeredCorrectly ? questionWeight : 0;
            this.model.set('_score', score);
        },

        // This is important and should give the user feedback on how they answered the question
        // Normally done through ticks and crosses by adding classes
        showMarking: function() {
            _.each(this.model.get('_items'), function(item, i) {
                var $item = this.$('.component-item').eq(i);
                $item.addClass(item._isCorrect ? 'correct' : 'incorrect');

                if(!item._isSelected) {
                    $item.addClass('not-selected');
                }
            }, this);
        },

        // Used by the question to determine if the question is incorrect or partly correct
        // Should return a boolean
        isPartlyCorrect: function() {
            return this.model.get('_isAtLeastOneCorrectSelection');
        },

        // Used by the question view to reset the stored user answer
        resetUserAnswer: function() {
        },

        // Used by the question to display the correct answer to the user
        showCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._shouldBeSelected);
            }, this);
        },

        setOptionSelected: function(index, selected, isNotSelected) {
            var $hotSpotItem = this.$('.hotSpot-item').eq(index);
            if(isNotSelected) {
                $hotSpotItem.addClass('not-selected');
            }

            if (selected) {
                $hotSpotItem.removeClass('incorrect').addClass('correct');
            } else {
                $hotSpotItem.removeClass('correct').addClass('incorrect');
            }
        },

        // Used by the question to display the users answer and
        // hide the correct answer
        // Should use the values stored in storeUserAnswer
        hideCorrectAnswer: function() {
            _.each(this.model.get('_items'), function(item, index) {
                this.setOptionSelected(index, item._isCorrect, !item._isSelected);
            }, this);
        },

        reRender: function() {
            if (Adapt.device.screenSize != 'large') {
                this.replaceWithGmcq();
            }
        },

        replaceWithGmcq:function(){
            if (!Adapt.componentStore.gmcq) throw "Gmcq not included in build";
            var Gmcq = Adapt.componentStore.gmcq;

            var model = this.prepareGmcqModel();
            var newGmcq = new Gmcq({model: model, $parent: this.options.$parent});
            newGmcq.reRender();
            //newGmcq.setupNarrative();
            this.options.$parent.append(newGmcq.$el);
            Adapt.trigger('device:resize');
            this.remove();

        },
        prepareGmcqModel:function(){
            var model = this.model;
            console.log(model.get('_items'))
            model.set('_component', 'gmcq');
            model.set('_wasHotSpot', true);
            model.set('body', model.get('body'));
            model.set('instruction', model.get('instruction'));

            return model;
        }
    });

    Adapt.register("hotSpot", HotSpot);

    return HotSpot;

});
