/// <reference types="cypress" />
/// <reference types="cypress-iframe" />

describe('aspects', () => {
  const aspects = [/^angular$/, /^angular-eslint-config$/, /^angular-v\d?\d$/, /^ng-packagr$/];

  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
  });

  it('should load base angular', () => {
    cy.contains("teambit.angular").click();

    for(let i = 0; i < aspects.length; i++) {
      cy.contains(aspects[i]).click();
      cy.frameLoaded({ url: '/preview' });
    }
  });
});

describe('components', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
  });

  it('should load examples', () => {
    cy.contains("examples").click();
    cy.contains('demo-lib-v').click();
    cy.frameLoaded({url: '/preview'});

    cy.contains("Compositions").click();
    cy.frameLoaded({url: '/preview'});
    // TODO disabled until bug "[Pubsub.ui] failed connecting to child iframe" is fixed
    cy.get('@consoleError').should('not.be.called');
    // Checking first composition
    cy.enter({url: '/preview'}).then(getBody => {
      getBody().contains('bit-test component works!').should('exist')
    });

    // Checking second composition
    // cy.contains('Standalone composition component').click();
    // cy.enter({url: '/preview'}).then(getBody => {
    //   getBody().contains('Composition component 1').should('exist');
    // });
  });
});
