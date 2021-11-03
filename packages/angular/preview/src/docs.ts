import { RenderingContext } from '@teambit/preview';
import { Type } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DocsTemplateAttrs } from './types';
import { gql, ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client/core';

export type DocsFile = {
  default: string;
};

window.onDocsLoad$ = window.onDocsLoad$ || new ReplaySubject<DocsTemplateAttrs>();

const COMPONENT_QUERY = gql`
query getComponent($id: String!) {
  getHost {
    id
    get(id: $id) {
      id {
        name
        version
        scope
      }
      displayName
      packageName
      description
      labels
      compositions {
        identifier
      }
    }
  }
}`;

export default async function docsRoot(
  _provider: Type<any> | undefined,
  componentId: string,
  docs: DocsFile | undefined,
  _compositionsMap: { [name: string]: Type<any> },
  _context: RenderingContext
) {
  // const angularRenderingContext = context.get(AngularAspect.id);
  // const component = await getComponentData(componentId);
  if (docs) {
    const cache = new InMemoryCache();
    const httpLink = new HttpLink({ credentials: 'include', uri: '/graphql' });
    const client = new ApolloClient({
      link: ApolloLink.from([httpLink]),
      cache
    });

    const res = await client.query({
      query: COMPONENT_QUERY,
      variables: {
        id: componentId
      }
    });
    const { description, displayName, labels, packageName } = res.data.getHost.get;
    const doc: DocsTemplateAttrs = {
      body: docs.default,
      attributes: {
        labels,
        displayName,
        packageName,
        description
      }
    };
    window.onDocsLoad$.next(doc);
  }
}
