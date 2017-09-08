import { ScSlideListPage } from './app.po';

describe('sc-slide-list App', () => {
  let page: ScSlideListPage;

  beforeEach(() => {
    page = new ScSlideListPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
