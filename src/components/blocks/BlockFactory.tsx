import { json } from "stream/consumers";
import BaseBlock from "./BaseBlock";
import TextBlock, {HeaderTextType} from "./impl/TextBlock";
import IconButton from "@mui/material/IconButton";
import {Cloud, ContentCopy, ContentCut, ContentPaste, MoreVert} from "@mui/icons-material";
import {Divider, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper, Typography} from "@mui/material";
import React, {useContext} from "react";
import {BlocksContext} from "../files/PolyFileEditor";

interface APIBlock {
    id: string
    kind: string
    values: any
    columnIndex: number
    rowIndex: number
}

const textTypes = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "--",
    "p"
]

export function DropdownBlocks(props: {handleClose: () => void, anchorEl: any}) {
    const open = Boolean(props.anchorEl);

    const { createNewBlock } = useContext(BlocksContext);

    const onAdd = (itemType: string) => {
        props.handleClose();
        let block = null;
        if(["h1", "h2", "h3", "h4", "h5", "h6", "p"].includes(itemType))
            block = new TextBlock("", itemType as HeaderTextType, true);

        if(!block) return;
        createNewBlock(block, 0);
    }

    return (
        <Menu
            id="long-menu"
            MenuListProps={{
                'aria-labelledby': 'long-button',
            }}
            anchorEl={props.anchorEl}
            open={open}
            onClose={props.handleClose}
            PaperProps={{
                style: {
                    maxHeight: 48 * 4.5,
                    width: '20ch',
                },
            }}
        >
            {textTypes.map((type, index) => {
                if(type === "--") return <Divider key={index} />
                else return <MenuItem key={index} selected={type === "p"} onClick={() => onAdd(type)}>
                    {type}
                </MenuItem>
            })}
        </Menu>
    );
}

export function toJson(blocks: BaseBlock[][]) {
    let jsonBlocks = [];
    for (let col = 0; col < blocks.length; col++) {
        const blockList = blocks[col];
        for (let row = 0; row < blockList.length; row++) {
            const block = blockList[row];
            jsonBlocks.push({
                id: block.id,
                columnIndex: col,
                rowIndex: row,
                kind: block.getType(),
                values: block.getValues()
            })
        }
    }
    return jsonBlocks;
}

export function newBlock(block: APIBlock): BaseBlock | null {

    let baseBlock: BaseBlock;

    const { id, kind } = block;

    if (kind.toLowerCase() === "text") {
        const { text, type } = block.values;
        baseBlock = new TextBlock(text, type, !Boolean(id));
        if (id) baseBlock.setId(id);
        return baseBlock;
    }

    return null;
}

export function generateMatrixBlocks(blocks: APIBlock[]): BaseBlock[][] {
    let matrix: BaseBlock[][] = createColumns([], getMaxColumnIndex(blocks));

    for (const block of blocks) {
        const baseBlock = newBlock(block);
        if (!baseBlock) continue;
        const { columnIndex, rowIndex } = block;

        matrix[columnIndex][rowIndex] = baseBlock;
    }

    return replaceNullBlocks(matrix);
}

const replaceNullBlocks = (matrix: BaseBlock[][]) => {
    for (const blockList of matrix) {
        for (let i = 0; i < blockList.length; i++) {
            if (!blockList[i])
                blockList[i] = new TextBlock("", "h2", true);
        }
    }
    return matrix;
}

const getMaxColumnIndex = (blocks: APIBlock[]): number => {
    let max: number = 0;
    for (const block of blocks) {
        if (block.columnIndex > max)
            max = block.columnIndex;
    }
    return max;
}

const createColumns = (matrix: any[][], columnIndex: number) => {
    for (let i = 0; i < columnIndex + 1; i++) {
        if (!matrix.at(i))
            matrix[i] = [];
    }
    return matrix;
}

const arrayInsert = (arr: any[], index: number, newItem: any) => [
    ...arr.slice(0, index),
    newItem,
    ...arr.slice(index)
]