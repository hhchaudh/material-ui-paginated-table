import React from "react";
import * as PropTypes from "prop-types";
import { makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles({
  container: ({ alignment }) => ({
    display: "flex",
    justifyContent:
      alignment === "right"
        ? "flex-end"
        : alignment === "center"
        ? "center"
        : "left",
  }),
});

const HeaderFilterCell = ({ headerText, alignment, FilterComponent, ...rest }) => {
  const classes = useStyles({alignment})

  return (
    <div className={classes.container}>
      <div>
        {headerText}
      </div>
      <FilterComponent {...rest}/>
    </div>
  );
};

HeaderFilterCell.defaultProps = {
  alignment: "left"
}

HeaderFilterCell.propTypes = {
  headerText: PropTypes.node.isRequired,
  alignment: PropTypes.oneOf(["left", "right", "center"]),
  FilterComponent: PropTypes.func.isRequired
};

export default HeaderFilterCell;
