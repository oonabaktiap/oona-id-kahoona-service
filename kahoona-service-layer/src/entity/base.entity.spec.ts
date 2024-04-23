import { Base } from './base.entity'; // Adjust the path accordingly

describe('Base Entity', () => {
  it('should create an instance of Base', () => {
    const base = new Base();
    expect(base).toBeInstanceOf(Base);
  });

  it('should have id property', () => {
    const base = new Base();
    base.id = 1;
    expect(base).toHaveProperty('id');
  });

  it('should have varString property', () => {
    const base = new Base();
    base.varString = 'varString';
    expect(base).toHaveProperty('varString');
  });

  it('should have varNumber property', () => {
    const base = new Base();
    base.varNumber = 123;
    expect(base).toHaveProperty('varNumber');
  });

  it('should have default values for varString and varNumber properties', () => {
    const base = new Base();
    expect(base.varString).toBeUndefined();
    expect(base.varNumber).toBeUndefined();
  });

  it('should set and get values for varString property', () => {
    const base = new Base();
    const varString = 'test string';
    base.varString = varString;
    expect(base.varString).toEqual(varString);
  });

  it('should set and get values for varNumber property', () => {
    const base = new Base();
    const varNumber = 123;
    base.varNumber = varNumber;
    expect(base.varNumber).toEqual(varNumber);
  });
});
