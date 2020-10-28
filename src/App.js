import React, { useEffect, useReducer, useState } from "react";
import {
  useTable,
  useFilters,
  useGlobalFilter,
  useSortBy,
  useAsyncDebounce,
  usePagination,
  useRowSelect,
} from "react-table";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  makeStyles,
  IconButton,
  Popover,
  Select,
  Typography,
  CircularProgress,
  Checkbox,
} from "@material-ui/core";
import {
  FilterList as FilterIcon,
  FirstPage,
  KeyboardArrowRight,
  KeyboardArrowLeft,
  LastPage,
} from "@material-ui/icons";
import _ from "lodash";
// A great library for fuzzy filtering/sorting items
import matchSorter from "match-sorter";

import makeData from "./makeData";
import HeaderFilterCell from "./HeaderFilterCell";

const useTableClasses = makeStyles({
  thCellContainer: {
    display: "flex",
  },
  rightAlignedThCellContainer: {
    display: "flex",
    justifyContent: "flex-end",
  },
  centerAlignedThCellContainer: {
    display: "flex",
    justifyContent: "center",
  },
  th: {
    paddingTop: "0.5rem",
    paddingBottom: "0.5rem",
    borderBottom: "3px solid green",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageSelect: {
    marginLeft: "1rem",
  },
  paginationContainer: {
    marginRight: "1rem",
  },
  recordsFoundContainer: {
    marginLeft: "1rem",
  },
  dataCell: {
    paddingTop: "0.5rem",
    paddingBottom: "0.5rem",
  },
});

const useParentClasses = makeStyles({
  rightAlignedCell: {
    textAlign: "right",
  },
});

const sortOrderReducer = (state) => {
  switch (state) {
    case undefined: {
      return false;
    }
    case false: {
      return true;
    }
    case true: {
      return undefined;
    }
    default:
      return state;
  }
};

// Define a default UI for filtering
function DefaultColumnFilter(props) {
  const {
    column: { filterValue, isSortedDesc, toggleSortBy, clearSortBy, setFilter },
    gotoPage,
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [inputValue, setInputValue] = useState(filterValue || "");
  const [desc, setDesc] = useReducer(sortOrderReducer, isSortedDesc);

  const handleSubmit = async () => {
    setFilter(inputValue || undefined);
    desc === undefined ? clearSortBy() : toggleSortBy(desc);
    gotoPage(0);
    handleClose();
  };

  const handleClose = () => {
    setInputValue("");
    setAnchorEl(null);
  };

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    setInputValue(filterValue);
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <FilterIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
        anchorEl={anchorEl}
      >
        <input
          value={inputValue || ""}
          onChange={(e) => {
            setInputValue(e.target.value); // Set undefined to remove the filter entirely
          }}
        />
        <button onClick={handleSubmit}>submit</button>
        <button onClick={() => setDesc()}>Sort Desc</button>
      </Popover>
    </>
  );
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]] });
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val;

// Our table component
function InternalTable({
  columns,
  data,
  onStateChange,
  pageCount: numPages,
  loading,
  totalCount,
  onRowsSelected,
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    prepareRow,
    state: { sortBy, filters, pageIndex, pageSize },
    setAllFilters,
    setSortBy,
    selectedFlatRows,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: 0,
      },
      pageCount: numPages,
      manualFilters: true,
      autoResetFilters: false,
      autoResetSortBy: false,
      disableMultiSort: true,
      manualSortBy: true,
      manualPagination: true,
      autoResetPage: false,
    },
    useFilters, // useFilters!
    useGlobalFilter, // useGlobalFilter!
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: "selection",
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          Header: ({ getToggleAllPageRowsSelectedProps }) => (
            <div>
              <Checkbox {...getToggleAllPageRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <Checkbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ]);
    }
  );

  const classes = useTableClasses();

  const onStateChangeDebounced = useAsyncDebounce(onStateChange, 100);

  useEffect(() => {
    onStateChangeDebounced({ sortBy, filters, pageSize, pageIndex });
  }, [onStateChangeDebounced, sortBy, filters, pageSize, pageIndex]);

  useEffect(() => {
    onRowsSelected(selectedFlatRows.map((d) => d.original));
  }, [onRowsSelected, selectedFlatRows]);

  return (
    <>
      {filters.length > 0 ? (
        <button
          onClick={() => {
            setAllFilters([]);
            setSortBy([]);
            gotoPage(0);
            setPageSize(10);
          }}
        >
          Reset
        </button>
      ) : null}
      <Table {...getTableProps()}>
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TableCell {...column.getHeaderProps()} className={classes.th}>
                  {column.render("Header")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      className={classes.dataCell}
                    >
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className={classes.footer}>
        <div className={classes.recordsFoundContainer}>
          {loading ? (
            <CircularProgress size="1rem" />
          ) : (
            <Typography>
              <i>
                Found {totalCount} {totalCount === 1 ? "record" : "records"}
              </i>
            </Typography>
          )}
        </div>
        <div className={classes.paginationContainer}>
          <IconButton
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage || loading}
          >
            {<FirstPage />}
          </IconButton>{" "}
          <IconButton
            onClick={() => previousPage()}
            disabled={!canPreviousPage || loading}
          >
            {<KeyboardArrowLeft />}
          </IconButton>{" "}
          <IconButton
            onClick={() => nextPage()}
            disabled={!canNextPage || loading}
          >
            {<KeyboardArrowRight />}
          </IconButton>{" "}
          <IconButton
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage || loading}
          >
            {<LastPage />}
          </IconButton>{" "}
          <span>
            Page{" "}
            <strong>
              {pageIndex + 1} of {pageOptions.length}
            </strong>{" "}
          </span>
          <Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              gotoPage(0);
            }}
            native
            disableUnderline
            className={classes.pageSelect}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <br />
      <div>
        <pre>
          <code>
            {JSON.stringify({ sortBy, filters, pageIndex, pageSize }, null, 2)}
          </code>
        </pre>
      </div>
    </>
  );
}

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const convertFilters = (filters) =>
  filters.reduce(
    (filterObj, f) => ({
      ...filterObj,
      [f.id]: f.value,
    }),
    {}
  );

const data = makeData(100000);

function App() {
  const [filteredData, setFilteredData] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const handleSubmitFilters = React.useCallback(
    async ({ filters, sortBy, pageSize, pageIndex }) => {
      setLoading(true);
      await sleep(1500).then(() => {
        const filterMap = convertFilters(filters);
        const startIndex = pageIndex * pageSize;
        const endIndex = startIndex + pageSize;
        let newData = data;

        if (filters.length > 0) {
          newData = newData.filter(
            (d) =>
              (!filterMap.firstName || d.firstName === filterMap.firstName) &&
              (!filterMap.lastName || d.lastName === filterMap.lastName)
          );
        }

        if (sortBy.length > 0) {
          const { id, desc } = sortBy[0];

          newData = _.orderBy(newData, [id], [desc ? "desc" : "asc"]);
        }

        setPageCount(Math.ceil(newData.length / pageSize));

        setTotalCount(newData.length);

        newData = newData.slice(startIndex, endIndex);

        setFilteredData(newData);
      });
      setLoading(false);
    },
    []
  );
  const classes = useParentClasses();

  const handleRowsSelect = React.useCallback((rows) => console.log(rows), []);

  const columns = React.useMemo(
    () => [
      {
        Header: (props) => (
          <HeaderFilterCell
            {...props}
            headerText="First Name"
            alignment="left"
            FilterComponent={DefaultColumnFilter}
          />
        ),
        accessor: "firstName",
      },
      {
        Header: (props) => (
          <HeaderFilterCell
            {...props}
            headerText="Last Name"
            alignment="left"
            FilterComponent={DefaultColumnFilter}
          />
        ),
        accessor: "lastName",
      },
      {
        Header: () => <div className={classes.rightAlignedCell}>Age</div>,
        accessor: "age",
        disableFilters: true,
        Cell: ({ value }) => (
          <div className={classes.rightAlignedCell}>{value}</div>
        ),
      },
      {
        Header: () => <div className={classes.rightAlignedCell}>Visits</div>,
        accessor: "visits",
        disableFilters: true,
        Cell: ({ value }) => (
          <div className={classes.rightAlignedCell}>{value}</div>
        ),
      },
      {
        Header: () => <div className={classes.rightAlignedCell}>Profile Progress</div>,
        accessor: "progress",
        disableFilters: true,
        Cell: ({ value }) => (
          <div className={classes.rightAlignedCell}>{value}</div>
        ),
      },
      {
        Header: "View Transaction",
        id: "txn",
        Cell: ({ row: { original } }) => (
          <button onClick={() => console.log(original)}>click me</button>
        ),
      },
    ],
    []
  );

  return (
    <InternalTable
      columns={columns}
      data={filteredData}
      onStateChange={handleSubmitFilters}
      pageCount={pageCount}
      loading={loading}
      totalCount={totalCount}
      onRowsSelected={handleRowsSelect}
    />
  );
}

export default App;
