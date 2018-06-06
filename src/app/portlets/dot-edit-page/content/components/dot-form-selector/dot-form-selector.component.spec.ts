/* tslint:disable:no-unused-variable */
import { DebugElement, Input, Component, Injectable } from '@angular/core';
import { DotFormSelectorComponent } from './dot-form-selector.component';
import { ComponentFixture, TestBed, async, tick, fakeAsync } from '@angular/core/testing';
import { DOTTestBed } from '../../../../../test/dot-test-bed';
import { ListingDataTableComponent } from '../../../../../view/components/listing-data-table/listing-data-table.component';
import { By } from '@angular/platform-browser';
import { DataTable } from 'primeng/primeng';
import { PaginatorService } from '../../../../../api/services/paginator';
import { Observable } from 'rxjs/Observable';
import { MockDotMessageService } from '../../../../../test/dot-message-service.mock';
import { DotMessageService } from '../../../../../api/services/dot-messages-service';
import { MessageKeyDirective } from '../../../../../view/directives/message-keys/message-keys.directive';
import * as _ from 'lodash';
import { DotDialogModule } from '../../../../../view/components/dot-dialog/dot-dialog.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

const mockContentType = {
    clazz: 'com.dotcms.contenttype.model.type.ImmutableWidgetContentType',
    defaultType: false,
    fixed: false,
    folder: 'SYSTEM_FOLDER',
    host: null,
    name: 'Hello World',
    owner: '123',
    system: false
};

@Injectable()
class PaginatorServiceMock {
    url = '';
    getCurrentPage = jasmine.createSpy('getCurrentPage');
}

const messageServiceMock = new MockDotMessageService({
    'contenttypes.form.name': 'Name',
    'dot.common.select': 'Select'
});

fdescribe('DotFormSelectorComponent', () => {
    let component: DotFormSelectorComponent;
    let fixture: ComponentFixture<DotFormSelectorComponent>;
    let de: DebugElement;

    beforeEach(async(() => {
        DOTTestBed.configureTestingModule({
            declarations: [DotFormSelectorComponent, MessageKeyDirective],
            providers: [
                {
                    provide: PaginatorService,
                    useClass: PaginatorServiceMock
                },
                {
                    provide: DotMessageService,
                    useValue: messageServiceMock
                },
            ],
            imports: [DotDialogModule, BrowserAnimationsModule]
        });
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DotFormSelectorComponent);
        component = fixture.componentInstance;
        de = fixture.debugElement;
    });

    describe('default', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        describe('p-dataTable component', () => {
            let pTableComponent: DebugElement;

            beforeEach(() => {
                fixture.detectChanges();
                pTableComponent = de.query(By.css('p-dataTable'));
            });

            it('should have one', () => {
                expect(pTableComponent).toBeTruthy();
            });
        });

        it('should have a next button', () => {
            const nextButton = de.query(By.css('button'));
            expect(nextButton).toBeTruthy();
        });
    });

    describe('data', () => {
        let pTableComponent: DebugElement;
        let paginatorService: PaginatorService;
        const paginationObservable = Observable.of([mockContentType]);

        beforeEach(() => {
            pTableComponent = de.query(By.css('p-dataTable'));
            paginatorService = fixture.debugElement.injector.get(PaginatorService);

            spyOn(paginatorService, 'getCurrentPage').and.returnValue(paginationObservable);
            fixture.detectChanges();
        });

        describe('pagination', () => {
            it('should set the url', () => {
                expect(paginatorService.url).toBe('v1/contenttype?type=FORM');
            });

            it('should load current page', () => {
                expect(paginatorService.getCurrentPage).toHaveBeenCalled();
                expect(pTableComponent.componentInstance.value).toEqual([mockContentType]);
            });

            it('should load next page', () => {
                const mockContentTypeCopy = _.cloneDeep(mockContentType);
                const nextPageObservable = Observable.of([mockContentTypeCopy]);
                spyOn(paginatorService, 'getNextPage').and.returnValue(nextPageObservable);

                const nextButton = de.query(By.css('button'));
                nextButton.triggerEventHandler('click', null);

                expect(paginatorService.getNextPage).toHaveBeenCalled();
                expect(pTableComponent.componentInstance.value).toEqual([mockContentTypeCopy]);
            });
        });

        describe('data/columns', () => {

            it('should have two columns and two rows', () => {
                const headRows = de.queryAll(By.css('table thead tr'));
                expect(headRows.length).toBe(1, 'must have one row head');

                const firstRowColumns = headRows[0].queryAll(By.css('th'));
                expect(firstRowColumns.length).toBe(2, 'must have two columns in head');

                const bodyRow = de.queryAll(By.css('table tbody tr'));
                expect(bodyRow.length).toBe(1, 'must have one row into body');

                const secondRowColumns = bodyRow[0].queryAll(By.css('td'));
                expect(secondRowColumns.length).toBe(2, 'must have two columns into body');
            });

            it('fisrt column should have the right header and content', () => {
                const label = de.query(By.css('table thead tr:first-child th:first-child span')).nativeElement.innerHTML;
                expect(label).toBe('Name');

                const content = de.query(By.css('table tbody tr:first-child td:first-child span')).nativeElement.innerHTML;
                expect(content).toBe('Hello World');
            });

            it('second column should have the right header and content', () => {
                const label = de.query(By.css('table thead tr:first-child th:nth-child(2n) span')).nativeElement.innerHTML;
                expect(label).toBe('');

                const link = de.query(By.css('table tbody tr:first-child td:nth-child(2n) span a'));
                expect(link).not.toBeNull();
                expect(link.nativeElement.innerHTML).toBe('Select');
            });
        });

        describe('events', () => {
            it('tigger event when click Select link', () => {
                spyOn(component.select, 'emit');

                const link = de.query(By.css('table tbody tr:first-child td:nth-child(2n) span a'));
                link.triggerEventHandler('click', null);

                expect(component.select.emit).toHaveBeenCalledWith(mockContentType);
            });
        });
    });
});