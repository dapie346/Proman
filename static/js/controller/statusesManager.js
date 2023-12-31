import {addCard, cardsManager} from "./cardsManager.js";
import {dataHandler} from "../data/dataHandler.js";
import {domManager} from "../view/domManager.js";
import {boardsManager} from "./boardsManager.js";
import {socket} from "../websocket.js";

export async function initDropdown() {
    let hamburgerButtons = document.querySelectorAll('.hamburger-btn');
    let optionMenus = document.querySelectorAll('.options-menu');
    await initDrop(hamburgerButtons, optionMenus)
    }

export async function initDrop(buttons, optionsMenu){
     buttons.forEach(button => {
        let buttonId = button.id;
        const columnId = button.dataset.statusId;
        let options = document.getElementById("btn-options-"+columnId);
        button.addEventListener('click', () => {
            optionsMenu.forEach(currentOptions => {
                if(currentOptions!==options) {
                    currentOptions.classList.remove('show');
                }
            });
            options.classList.toggle('show');
        });
        const boardId = buttonId.slice(4);
        getActionButton("newCard", columnId).addEventListener('click', () => {
            options.classList.remove('show');
            addCard(boardId, columnId);
        });
        getActionButton("renameColumn", columnId).addEventListener('click', () => {
            options.classList.remove('show');
            columnRenaming(columnId, true);
        });
        getActionButton("deleteColumn", columnId).addEventListener('click', () => {
            options.classList.remove('show');
            statusRemoval(columnId);
        });
    })
}
export async function initDropAndColumns(board){
         let current_board = document.querySelector(`.board[data-board-id="${board['id']}"]`)
            let hamburgerButtons = await current_board.querySelectorAll('.hamburger-btn');
            let optionMenus = await current_board.querySelectorAll('.options-menu');
            await initDrop(hamburgerButtons, optionMenus)
     }


function getActionButton(actionName, columnId){
    return document.getElementById(actionName+columnId);
}

async function columnRenaming(statusId, rename=false){
    let targetElement = document.querySelector(`.status-title[data-status-id="${statusId}"]`);
    const oldStatus = targetElement.innerText;
    targetElement.innerText = "";
    domManager.addChild(`.status-title[data-status-id="${statusId}"]`,
        `<input id="new-status-input" class="input" value="${oldStatus}" placeholder="${oldStatus}">`);
    const inputElement = document.getElementById("new-status-input");
    inputElement.addEventListener("blur", (event) => {
        handleColumnRename(true, rename)
    });
    inputElement.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            handleColumnRename(false, rename);
        }
    });
    inputElement.focus();
    function handleColumnRename(emit=false, rename){
        let boardId = targetElement.dataset.boardId
        if (inputElement.value) {

            const newStatus = inputElement.value;
            targetElement.innerText = newStatus;
            dataHandler.renameStatus(statusId, newStatus);
            if (rename && emit !== false){
                socket.emit('rename columns inside board', {'statusId': statusId, 'newStatus': newStatus, 'rename': rename});
            } else if (emit !== false){
                socket.emit('update columns inside board', {'boardId': boardId, 'statusId': statusId, 'newStatus': newStatus, 'rename': rename});
            }
        }
        else {
            targetElement.innerText = oldStatus;
            if (!rename && emit !== false){
                socket.emit('update columns inside board', {'boardId': boardId, 'statusId': statusId, 'newStatus': oldStatus,'rename': rename});
        }}
        inputElement.remove();

    }
}

async function statusRemoval(columnId){
    await dataHandler.deleteStatus(columnId);
    socket.emit('remove status', columnId)
}

export async function addColumnButtonHandler(clickEvent){
    const addColumnButton = clickEvent.target;
    const boardId = addColumnButton.dataset.boardId
    const newStatus = "new card";
        await dataHandler.createStatus(boardId, newStatus)
    const statusId = await dataHandler.getLastStatusId();
    await addColumn(boardId,statusId, newStatus)
}

export async function addColumn(boardId,statusId, newStatus){
    const board = document.getElementById(`${boardId}`);
    const content = createColumn(boardId, statusId, newStatus);
    board.innerHTML += content;
    await initDropAndColumns({'id': boardId})
    await columnRenaming(statusId);
    const cards = await dataHandler.getCardsByBoardId(boardId);
        for (let card of cards) {
            await cardsManager.cardEvent(card)
        }
    await boardsManager.modifyingColumns()
}
export function createColumn(boardId, statusId, newStatus) {
    return `<div class="board-column" data-status-id="${statusId}">
            <div class="board-column-title">
                <div class="status">
                    <div class="status-title" data-status-id="${statusId}" data-board-id="${boardId}">${newStatus}</div>
                    <div class="status-options">
                        <div class="hamburger-btn" id="btn-${boardId}" data-status-id="${statusId}">
                            <div class="hamburger-line"></div>
                            <div class="hamburger-line"></div>
                            <div class="hamburger-line"></div>
                        </div>
                        <ul class="options-menu" id="btn-options-${statusId}" >
                            <li class="menu-item" id="newCard${statusId}">Add new card</li>
                            <li class="menu-item" id="renameColumn${statusId}">Rename column</li>
                            <li class="menu-item" id="deleteColumn${statusId}">Delete column</li>
                        </ul>
                    </div>
                    </div>
                </div>
            <div class="board-column-content" 
                data-board-id="${boardId}"
                data-column-id="${statusId}"></div>
        </div>`;
}