import {
  Component,  Directive,  TemplateRef,  ContentChildren,
  QueryList,  Input,  AfterContentChecked,  OnInit,
  OnChanges,  OnDestroy,  Output,  EventEmitter,
  Injectable, ElementRef
} from '@angular/core';
import { animate, style, trigger, transition, state , group, keyframes} from '@angular/animations';

// import {NgbCarouselConfig} from './carousel-config';


export interface SlideConfig {
  interval : number;
  wrap : boolean;
  keyboard : boolean;
}
let nextId = 0;

/**
 * Represents an individual slide to be used within a carousel.
 */
@Directive({selector: 'ng-template[slideItem]'})
export class SlideItem {
  /**
   * Unique slide identifier. Must be unique for the entire document for proper accessibility support.
   * Will be auto-generated if not provided.
   */
  @Input() id = `slide-item${nextId++}`;
  constructor(public tplRef: TemplateRef<any>) {}
}

/**
 * Directive to easily create carousels based on Bootstrap's markup.
 */
@Component({
  selector: 'sc-slide-list',
  // exportAs: 'slideList',
  // encapsulation : ViewEncapsulation.None,
  host: {
    'class': 'carousel slide',
    '[style.display]': '"block"',
    'tabIndex': '0',
    '(mouseenter)': 'pause()',
    '(mouseleave)': 'cycle()',
    // '(keydown.arrowLeft)': 'keyPrev()',
    // '(keydown.arrowRight)': 'keyNext()'
  },
  template: `
    <div class="slide-list-inner">
      <div *ngFor="let slide of slides" class="slide-item"  [ngClass]="{'active' : slide.id === activeId}"
      id = {{slide.id}}
      >
        <ng-template [ngTemplateOutlet]="slide.tplRef"></ng-template>
      </div>
    </div>
    `,
  styles : [
    `
      .slide-list-inner{
        position: relative;
        width: 100%;
        overflow: hidden;
      }

      .slide-item {
        position: relative;
        display: none;
        -ms-flex-align: center;
        align-items: center;
        width: 100%;
        transition: -webkit-transform .6s ease;
        transition: transform .6s ease;
        transition: transform .6s ease,-webkit-transform .6s ease;
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        -webkit-perspective: 1000px;
        perspective: 1000px;
      }
      .active {
        display : block;
      }
      .changing {
        display : block;
      }
      .ch {
        top : 0px;
        position: absolute;
        transform : translate(0,100%)
      }
      .inactive{
        transform : translate(0,-100%)
      }
      .full-list {
        display : block;
        position : relative;
      }

    `
  ],

  // animations : [
  //   trigger("onActivate",[
  //     state('inactive',style({transform : 'translate(0,-100%)'})),
  //     transition('ready => active' , style({transform : 'translate(0,0)'}), animate(600)),
  //     transition('active => inactive', style({transform : 'translate(0,-100%)'}), animate(600)),
  //     ]
  //   )
  // ]
})
export class SlideList implements AfterContentChecked,
    OnDestroy, OnInit, OnChanges {
  @ContentChildren(SlideItem) slides: QueryList<SlideItem>;
  private _slideChangeInterval;
  /**
   * 자동으로 다음 리스트로 넘어가는 시간
   */
  @Input('interval') interval: number = 2500;

  /**
   * 마지막 리스트 -> 첫리스트, 마지막 리스트 <- 첫리스트
   */
  @Input('wrap') wrap: boolean = true;


  @Input('useLastTofirstEvent') lastCall : boolean = false;


  @Input() activeId: string;


  @Output() slide = new EventEmitter<SlideEvent>();
  @Output() lfEvent = new EventEmitter<any>()
  oldSlide : QueryList<SlideItem>;


  constructor(private el : ElementRef){}

  ngAfterContentChecked() {

    let activeSlide = this._getSlideById(this.activeId);
    this.activeId = activeSlide ? activeSlide.id : (this.slides.length ? this.slides.first.id : null);
  }

  ngOnInit() {
    this._startTimer();
  }

  ngOnChanges(changes) {
    if ('interval' in changes && !changes['interval'].isFirstChange()) {
      this._restartTimer();
    }
  }

  ngOnDestroy() { clearInterval(this._slideChangeInterval); }



  /**
   * Navigate to the next slide.
   */
  next() {
    this.cycleToNext();
    this._restartTimer();
  }

  /**
   * Stops the carousel from cycling through items.
   */
  pause() {
    console.log('pause')
    this._stopTimer();
    this.slides.map(slide => {
      document.querySelector('#'+slide.id).classList.add('full-list')
    })
  }

  /**
   * Restarts cycling through the carousel slides from left to right.
   */
  cycle() {
    console.log('cycle')
    this._startTimer();
    this.slides.map(slide => {
      document.querySelector('#'+slide.id).classList.remove('full-list')
    })
  }

  cycleToNext() { this.cycleToSelected(this._getNextSlide(this.activeId), SlideEventDirection.UP); }

  cycleToSelected(slideIdx: string, direction: SlideEventDirection) {
    let selectedSlide = this._getSlideById(slideIdx);
    let activeSlide = this._getSlideById(this.activeId)
    if (selectedSlide) {
      if (selectedSlide.id !== this.activeId) {
        this.slide.emit({prev: this.activeId, current: selectedSlide.id, direction: direction});
      }
      if(this.lastCall&&this._getSlideIdxById(selectedSlide.id) === 0 ){
        this.lfEvent.emit({'result' : 'lastSlide'})
      }
      this.changeTransition(this.activeId,selectedSlide,direction)
      const activeElement = document.querySelector("#"+this.activeId);
      const selectedElement = document.querySelector("#"+selectedSlide.id)
      setTimeout(
        ()=>{
          selectedElement.classList.remove('changing','ch');
          activeElement.classList.remove('inactive');
          this.activeId = selectedSlide.id;
        },600)

    }
  }

  _getSlideIndex(currentSlideId){
    const slideArr = this.slides.toArray();
    const currentSlideIdx = this._getSlideIdxById(currentSlideId);
    // const isLastSlide = currentSlideIdx === slideArr.length - 1;
  }

  changeTransition(activeId, selectedSlide,direction){
    const activeSlide = this._getSlideById(activeId);
    const activeElement = document.querySelector("#"+activeSlide.id);
    const selectedElement = document.querySelector("#"+selectedSlide.id)
    selectedElement.classList.add('changing','ch');
    activeElement.classList.add('inactive');


  }



  private _restartTimer() {
    this._stopTimer();
    this._startTimer();
  }

  private _startTimer() {
    if (this.interval > 0) {
      this._slideChangeInterval = setInterval(() => { this.cycleToNext(); }, this.interval);
    }
  }

  private _stopTimer() { clearInterval(this._slideChangeInterval); }

  private _getSlideById(slideId: string): SlideItem {
    let slideWithId: SlideItem[] = this.slides.filter(slide => slide.id === slideId);
    return slideWithId.length ? slideWithId[0] : null;
  }

  private _getSlideIdxById(slideId: string): number {
    return this.slides.toArray().indexOf(this._getSlideById(slideId));
  }

  private _getNextSlide(currentSlideId: string): string {
    const slideArr = this.slides.toArray();
    const currentSlideIdx = this._getSlideIdxById(currentSlideId);
    const isLastSlide = currentSlideIdx === slideArr.length - 1;

    return isLastSlide ? (this.wrap ? slideArr[0].id : slideArr[slideArr.length - 1].id) :
                         slideArr[currentSlideIdx + 1].id;
  }



}

/**
* The payload of the slide event fired when the slide transition is completed
*/
export interface SlideEvent {

  prev: string;

  current: string;

  direction: SlideEventDirection;
}

/**
 * Enum to define the carousel slide event direction
 */
export enum SlideEventDirection {
  UP = <any>'up',
  DOWN = <any>'down'
}

// export const NGB_CAROUSEL_DIRECTIVES = [NgbCarousel, NgbSlide];
