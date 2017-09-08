import { Component, ElementRef, Renderer, Renderer2, ViewContainerRef, ViewRef } from '@angular/core';
import { SlideList } from './slide/slide-list.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(){

  }

  list = [
    '11111111111111',
    '22222222222222',
    '33333333333333'
  ]

  slide(e : any){
    // console.log(e,this.list)
  }


  title = 'app';
}
