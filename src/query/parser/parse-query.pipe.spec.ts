import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdvancedQuery } from 'query';
import { anyString, instance, mock, when } from 'ts-mockito';
import { AdvancedQueryParser } from './advanced-query.parser';
import { ParseQueryPipe } from './parse-query.pipe';

describe('ParseQueryPipe', () => {
  let parsePipe: ParseQueryPipe<any>;
  const parserMock: AdvancedQueryParser = mock(AdvancedQueryParser);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AdvancedQueryParser,
          useValue: instance(parserMock),
        },
        ParseQueryPipe,
      ],
    }).compile();

    parsePipe = module.get<ParseQueryPipe<any>>(ParseQueryPipe);
  });

  it('should be defined', () => {
    expect(parsePipe).toBeDefined();
  });

  describe('transform', () => {
    let metadata: ArgumentMetadata;
    const parsedValue = new AdvancedQuery(null);

    beforeEach(() => {
      metadata = { type: 'custom', metatype: AdvancedQuery };

      when(parserMock.parse(anyString())).thenReturn(parsedValue);
    });

    describe('caught exception from parser', () => {
      let expectedException: Error;

      beforeEach(() => {
        expectedException = new BadRequestException('mocked error');
        when(parserMock.parse(anyString())).thenThrow(expectedException);
      });

      it('should rethrow parser exception', () => {
        expect(() => parsePipe.transform('any query', metadata)).toThrowError(BadRequestException);
      });
    });

    describe('metadata type != custom', () => {
      beforeEach(() => {
        metadata = { ...metadata, type: 'query' };
      });

      it('should return unchanged value', () => {
        const inputValue = 'this should not be a valid query';

        const transformedValue = parsePipe.transform(inputValue, metadata);

        expect(transformedValue).toEqual(inputValue);
      });
    });
    describe('target type != AdvancedQuery', () => {
      beforeEach(() => {
        metadata = { ...metadata, metatype: AdvancedQueryParser };
      });

      it('should return unchanged value', () => {
        const inputValue = 'this should not be a valid query';

        const transformedValue = parsePipe.transform(inputValue, metadata);

        expect(transformedValue).toEqual(inputValue);
      });
    });
    describe('valid query', () => {
      it('should return parse result', () => {
        const inputValue = 'mock query';

        const transformedValue = parsePipe.transform(inputValue, metadata);

        expect(transformedValue).toEqual(parsedValue);
      });
    });
  });
});
