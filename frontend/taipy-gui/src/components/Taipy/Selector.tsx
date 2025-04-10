/*
 * Copyright 2021-2024 Avaiga Private Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React, { useState, useCallback, useEffect, useMemo, CSSProperties, MouseEvent, ChangeEvent } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { Theme, useTheme } from "@mui/material";

import { doNotPropagateEvent, getSuffixedClassNames, getUpdateVar } from "./utils";
import { createSendUpdateAction } from "../../context/taipyReducers";
import { ItemProps, LovImage, paperBaseSx, SelTreeProps, showItem, SingleItem, useLovListMemo } from "./lovUtils";
import {
    useClassNames,
    useDispatch,
    useDispatchRequestUpdateOnFirstRender,
    useDynamicProperty,
    useModule,
} from "../../utils/hooks";
import { Icon } from "../../utils/icon";

const MultipleItem = ({ value, clickHandler, selectedValue, item, disabled }: ItemProps) => (
    <ListItemButton onClick={clickHandler} data-id={value} dense disabled={disabled}>
        <ListItemIcon>
            <Checkbox
                disabled={disabled}
                edge="start"
                checked={selectedValue.includes(value)}
                tabIndex={-1}
                disableRipple
            />
        </ListItemIcon>
        {typeof item === "string" ? (
            <ListItemText primary={item} />
        ) : (
            <ListItemAvatar>
                <LovImage item={item} />
            </ListItemAvatar>
        )}
    </ListItemButton>
);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const getMenuProps = (height?: string | number) => ({
    PaperProps: {
        style: {
            maxHeight: height || ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        },
    },
});

const getStyles = (id: string, ids: readonly string[], theme: Theme) => ({
    fontWeight: ids.indexOf(id) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
});

const renderBoxSx = {
    display: "flex",
    flexWrap: "wrap",
    gap: 0.5,
    width: "100%",
} as CSSProperties;

const Selector = (props: SelTreeProps) => {
    const {
        id,
        defaultValue = "",
        value,
        updateVarName = "",
        defaultLov = "",
        filter = false,
        propagate = true,
        lov,
        updateVars = "",
        width = "100%",
        height,
        valueById,
        mode = "",
    } = props;
    const [searchValue, setSearchValue] = useState("");
    const [selectedValue, setSelectedValue] = useState<string[]>([]);
    const dispatch = useDispatch();
    const module = useModule();
    const theme = useTheme();

    const className = useClassNames(props.libClassName, props.dynamicClassName, props.className);
    const active = useDynamicProperty(props.active, props.defaultActive, true);
    const hover = useDynamicProperty(props.hoverText, props.defaultHoverText, undefined);

    useDispatchRequestUpdateOnFirstRender(dispatch, id, module, updateVars, updateVarName);

    const isRadio = mode && mode.toLocaleLowerCase() == "radio";
    const isCheck = mode && mode.toLocaleLowerCase() == "check";
    const dropdown = isRadio || isCheck || props.dropdown === undefined ? false : props.dropdown;
    const multiple = isCheck ? true : isRadio || props.multiple === undefined ? false : props.multiple;

    const lovList = useLovListMemo(lov, defaultLov);
    const listSx = useMemo(
        () => ({
            bgcolor: "transparent",
            overflowY: "auto",
            width: "100%",
            maxWidth: width,
        }),
        [width]
    );
    const paperSx = useMemo(() => {
        let sx = paperBaseSx;
        if (height !== undefined) {
            sx = { ...sx, maxHeight: height };
        }
        if (width !== undefined) {
            // sx = { ...sx, maxWidth: width };
        }
        return sx;
    }, [height, width]);
    const controlSx = useMemo(() => ({ my: 1, mx: 0, width: width, display: "flex" }), [width]);

    useEffect(() => {
        if (value !== undefined && value !== null) {
            setSelectedValue(Array.isArray(value) ? value.map((v) => "" + v) : ["" + value]);
        } else if (defaultValue) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(defaultValue);
            } catch (e) {
                parsedValue = defaultValue;
            }
            setSelectedValue(Array.isArray(parsedValue) ? parsedValue : [parsedValue]);
        }
    }, [defaultValue, value]);

    const selectHandler = useCallback(
        (key: string) => {
            setSelectedValue((keys) => {
                if (multiple) {
                    const newKeys = [...keys];
                    const p = newKeys.indexOf(key);
                    if (p === -1) {
                        newKeys.push(key);
                    } else {
                        newKeys.splice(p, 1);
                    }
                    dispatch(
                        createSendUpdateAction(
                            updateVarName,
                            newKeys,
                            module,
                            props.onChange,
                            propagate,
                            valueById ? undefined : getUpdateVar(updateVars, "lov")
                        )
                    );
                    return newKeys;
                } else {
                    dispatch(
                        createSendUpdateAction(
                            updateVarName,
                            key,
                            module,
                            props.onChange,
                            propagate,
                            valueById ? undefined : getUpdateVar(updateVars, "lov")
                        )
                    );
                    return [key];
                }
            });
        },
        [updateVarName, dispatch, multiple, propagate, updateVars, valueById, props.onChange, module]
    );

    const clickHandler = useCallback(
        (evt: MouseEvent<HTMLElement>) => {
            if (active) {
                const { id: key = "" } = evt.currentTarget.dataset;
                selectHandler(key);
            }
        },
        [active, selectHandler]
    );

    const changeHandler = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            if (active) {
                const { id: key = "" } = (evt.currentTarget as HTMLElement).parentElement?.dataset || {};
                selectHandler(key);
            }
        },
        [active, selectHandler]
    );

    const handleChange = useCallback(
        (event: SelectChangeEvent<typeof selectedValue>) => {
            const {
                target: { value },
            } = event;
            setSelectedValue(Array.isArray(value) ? value : [value]);
            dispatch(
                createSendUpdateAction(
                    updateVarName,
                    value,
                    module,
                    props.onChange,
                    propagate,
                    valueById ? undefined : getUpdateVar(updateVars, "lov")
                )
            );
        },
        [dispatch, updateVarName, propagate, updateVars, valueById, props.onChange, module]
    );

    const handleDelete = useCallback(
        (e: React.SyntheticEvent) => {
            const id = e.currentTarget?.parentElement?.getAttribute("data-id");
            id &&
                setSelectedValue((vals) => {
                    const keys = vals.filter((valId) => valId !== id);
                    dispatch(
                        createSendUpdateAction(
                            updateVarName,
                            keys,
                            module,
                            props.onChange,
                            propagate,
                            valueById ? undefined : getUpdateVar(updateVars, "lov")
                        )
                    );
                    return keys;
                });
        },
        [updateVarName, propagate, dispatch, updateVars, valueById, props.onChange, module]
    );

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value), []);

    const dropdownValue = ((dropdown || isRadio) &&
        (multiple ? selectedValue : selectedValue.length > 0 ? selectedValue[0] : "")) as string[];

    return (
        <FormControl sx={controlSx} className={className}>
            {props.label ? (
                isRadio || isCheck ? (
                    <FormLabel>{props.label}</FormLabel>
                ) : (
                    <InputLabel disableAnimation className={!dropdown ? "static-label" : undefined}>
                        {props.label}
                    </InputLabel>
                )
            ) : null}
            <Tooltip title={hover || ""} placement={dropdown ? "top" : undefined}>
                {isRadio ? (
                    <RadioGroup
                        value={dropdownValue}
                        onChange={handleChange}
                        className={getSuffixedClassNames(className, "-radio-group")}
                    >
                        {lovList.map((item) => (
                            <FormControlLabel
                                key={item.id}
                                value={item.id}
                                control={<Radio />}
                                label={
                                    typeof item.item === "string" ? item.item : <LovImage item={item.item as Icon} />
                                }
                                style={getStyles(item.id, selectedValue, theme)}
                                disabled={!active}
                            />
                        ))}
                    </RadioGroup>
                ) : isCheck ? (
                    <FormGroup className={getSuffixedClassNames(className, "-check-group")}>
                        {lovList.map((item) => (
                            <FormControlLabel
                                key={item.id}
                                control={
                                    <Checkbox
                                        data-id={item.id}
                                        checked={selectedValue.includes(item.id)}
                                        onChange={changeHandler}
                                    />
                                }
                                label={
                                    typeof item.item === "string" ? item.item : <LovImage item={item.item as Icon} />
                                }
                                style={getStyles(item.id, selectedValue, theme)}
                                disabled={!active}
                            ></FormControlLabel>
                        ))}
                    </FormGroup>
                ) : dropdown ? (
                    <Select
                        id={id}
                        multiple={multiple}
                        value={dropdownValue}
                        onChange={handleChange}
                        input={<OutlinedInput label={props.label} />}
                        disabled={!active}
                        renderValue={(selected) => (
                            <Box sx={renderBoxSx}>
                                {lovList
                                    .filter((it) =>
                                        Array.isArray(selected) ? selected.includes(it.id) : selected === it.id
                                    )
                                    .map((item, idx) => {
                                        if (multiple) {
                                            const chipProps = {} as Record<string, unknown>;
                                            if (typeof item.item === "string") {
                                                chipProps.label = item.item;
                                            } else {
                                                chipProps.label = item.item.text || "";
                                                chipProps.avatar = <Avatar src={item.item.path} />;
                                            }
                                            return (
                                                <Chip
                                                    key={item.id}
                                                    {...chipProps}
                                                    onDelete={handleDelete}
                                                    data-id={item.id}
                                                    onMouseDown={doNotPropagateEvent}
                                                    disabled={!active}
                                                />
                                            );
                                        } else if (idx === 0) {
                                            return typeof item.item === "string" ? (
                                                item.item
                                            ) : (
                                                <LovImage item={item.item} />
                                            );
                                        } else {
                                            return null;
                                        }
                                    })}
                            </Box>
                        )}
                        MenuProps={getMenuProps(height)}
                    >
                        {lovList.map((item) => (
                            <MenuItem key={item.id} value={item.id} style={getStyles(item.id, selectedValue, theme)} disabled={item.id === null}>
                                {typeof item.item === "string" ? item.item : <LovImage item={item.item as Icon} />}
                            </MenuItem>
                        ))}
                    </Select>
                ) : (
                    <Paper sx={paperSx}>
                        {filter && (
                            <Box>
                                <OutlinedInput
                                    margin="dense"
                                    placeholder="Search field"
                                    value={searchValue}
                                    onChange={handleInput}
                                    disabled={!active}
                                />
                            </Box>
                        )}
                        <List sx={listSx} id={id}>
                            {lovList
                                .filter((elt) => showItem(elt, searchValue))
                                .map((elt) =>
                                    multiple ? (
                                        <MultipleItem
                                            key={elt.id}
                                            value={elt.id}
                                            item={elt.item}
                                            selectedValue={selectedValue}
                                            clickHandler={clickHandler}
                                            disabled={!active}
                                        />
                                    ) : (
                                        <SingleItem
                                            key={elt.id}
                                            value={elt.id}
                                            item={elt.item}
                                            selectedValue={selectedValue}
                                            clickHandler={clickHandler}
                                            disabled={!active}
                                        />
                                    )
                                )}
                        </List>
                    </Paper>
                )}
            </Tooltip>
        </FormControl>
    );
};

export default Selector;
