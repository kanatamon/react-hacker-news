import * as React from 'react';
import { compose } from 'recompose';
import './App.css';

const applyUpdateResult = (result: State) => (prevState: State) => ({
  hits: [...prevState.hits, ...result.hits],
  page: result.page,
  isLoading: false,
});

const applySetResult = (result: State) => (prevState: State) => ({
  hits: result.hits,
  page: result.page,
  isLoading: false,
});

const getHackerNewsUrl = (value: string, page: number) =>
  `https://hn.algolia.com/api/v1/search?query=${value}&page=${page}&hitsPerPage=100`;

interface Hit {
  url: string;
  objectID: string;
  title: string;
}

interface State {
  hits: Array<Hit>;
  page: number | undefined;
  isLoading: boolean;
}

class App extends React.Component<{}, State> {
  searchElement: HTMLInputElement | null;

  constructor(prop: {}) {
    super(prop);
    this.state = {
      hits: [],
      page: undefined,
      isLoading: false,
    };
  }

  onInitialSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!this.searchElement || this.searchElement.value === '') {
      return;
    }
    this.fetchStories(this.searchElement.value, 0);
  }

  onPaginatedSearch = () => {
    if (!this.searchElement
      || this.searchElement.value === ''
      || this.state.page === undefined) {
      return;
    }
    this.fetchStories(this.searchElement.value, this.state.page + 1);
  }

  fetchStories = (value: string, page: number) => {
    this.setState({ isLoading: true });
    fetch(getHackerNewsUrl(value, page))
      .then(response => response.json())
      .then(result => this.onSetResult(result, page));
  }

  onSetResult = (result: State, page: number) =>
    page === 0
      ? this.setState(applySetResult(result))
      : this.setState(applyUpdateResult(result))

  render() {
    return (
      <div className="page">
        <div className="interactions">
          <form onSubmit={this.onInitialSearch}>
            <input type="text" ref={element => this.searchElement = element} />
            <button type="submit">Search</button>
          </form>

          <ListWithInfiniteScrollWithLoading
            list={this.state.hits}
            page={this.state.page}
            onPaginatedSearch={this.onPaginatedSearch}
            isLoading={this.state.isLoading}
          />
        </div>
      </div>
    );
  }
}

interface ListProps {
  list: Array<Hit>;
  page: number | undefined;
  onPaginatedSearch: () => void;
  isLoading: boolean;
}

const List: React.StatelessComponent<ListProps> = ({ list }) => (
  <div>
    <div className="list">
      {list.map(item => <div className="list-row" key={item.objectID}>
        <a href={item.url}>{item.title}</a>
      </div>)}
    </div>
  </div>
);

function withInfiniteScroll(Component: React.ComponentType<ListProps>) {
  return class WithInfiniteScroll extends React.Component<ListProps> {
    componentDidMount() {
      window.addEventListener('scroll', this.onScroll, false);
    }

    componentWillUnmount() {
      window.removeEventListener('scroll', this.onScroll, false);
    }

    onScroll = () => {
      if (
        (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500) &&
        this.props.list.length
      ) {
        this.props.onPaginatedSearch();
      }
    }
    
    render() {
      return <Component {...this.props}/>;
    }
  };
}

// const withPaginated = (Component: React.ComponentType<ListProps>) => (props: ListProps) => (
//   <div>
//     <Component {...props} />

//     <div className="interactions">
//       {
//         (props.page !== undefined && !props.isLoading) &&
//         <button
//           type="button"
//           onClick={props.onPaginatedSearch}
//         >
//           More
//         </button>
//       }
//     </div>
//   </div>
// );

const withLoading = (Component: React.ComponentType<ListProps>) => (props: ListProps) => (
  <div>
    <Component {...props} />

    <div className="interactions">
      {props.isLoading && <span>Loading...</span>}
    </div>
  </div>
);

const ListWithInfiniteScrollWithLoading = compose<{}, ListProps>(
  withLoading,
  withInfiniteScroll,
)(List);

export default App;
