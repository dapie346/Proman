import {dataHandler} from "../data/dataHandler.js";
import {htmlFactory, htmlTemplates} from "../view/htmlFactory.js";
import {domManager} from "../view/domManager.js";
import {addCard, cardsManager} from "./cardsManager.js";

export let boardsManager = {
    loadBoards: async function () {
        const boards = await dataHandler.getBoards();
        for (let board of boards) {
            await loadBoard(board)
        }
        // initDropdown();
    },
    creatingNewBoard: async function () {
         await newBoardButtonCreation('public')
        await newBoardButtonCreation('private')
    },
    modifyingColumns: function () {
        const boardsColumnsContainers = document.querySelectorAll('.board-column-content');
        boardsColumnsContainers.forEach((element) => {
            element.addEventListener('drop', (event) => {
                event.preventDefault()
                const cardId = localStorage.getItem('dragged-item')
                const card = document.querySelector(`.card[data-card-id="${cardId}"]`)
                if (card.classList.contains("card")) {
                    element.appendChild(card)
                }
            });
            element.addEventListener('dragover', (event) => {
                event.preventDefault()
            });
            element.addEventListener('dragenter', (event) => {
                if(event.target.classList.contains('board-column-content')){
                    const boardId = event.target.dataset['boardId']
                    const columnId = event.target.dataset['columnId']
                    saveTargetElementToLocalStorage("true", boardId, columnId)
                } else if(event.target.parentElement.classList.contains('card')){
                    const boardId = event.target.parentElement.parentElement.dataset['boardId']
                    const columnId = event.target.parentElement.parentElement.dataset['columnId']
                    saveTargetElementToLocalStorage("false", boardId, columnId)
                }
            })
        })
    }
};

export async function loadBoard(board){
    const statuses = await dataHandler.getStatuses();
    const boardBuilder = htmlFactory(htmlTemplates.board, statuses);
            const content = boardBuilder(board, statuses);
            domManager.addChild("#root", content);
            domManager.addEventListener(
                `.board-toggle[data-board-id="${board.id}"]`,
                "click",
                showHideButtonHandler
            );
}

async function newBoardButtonCreation(type){
    const newBoardBtn = document.querySelector(`#new-${type}-board-btn`);
    const newBoardContainer = document.querySelector(`#new-${type}-board-input-container`);
    toggleBoardNameInput(newBoardBtn, newBoardContainer)
}

function toggleBoardNameInput(boardBtn, BoardContainer){
    boardBtn.addEventListener('click', () => {
            let newBoardContainerVisibility = BoardContainer.style.display;
            if (newBoardContainerVisibility === "block"){
                BoardContainer.style.display = "none"
            } else {
                BoardContainer.style.display = "block"
            }
        });
}

function showHideButtonHandler(clickEvent) {
    clickEvent.target.classList.toggle("flip");
    const boardId = checkChildren(clickEvent.target);
    let board = document.getElementById(boardId);
    if (board.classList.contains("hide-board")) {
        cardsManager.loadCards(boardId);
        board.classList.remove("hide-board");

    }
    else {
        cardsManager.deleteCards(boardId);
        board.classList.add("hide-board");
    }
}

function checkChildren(target) {
    if (target.children.length > 0){
        return target.dataset.boardId;
    } else {
        return target.parentElement.dataset.boardId;
    }
}

function renameBoard (board) {
    const titleId = board.target.dataset['boardTitleId'];
    let text = board.target.innerText;
    const boardId = board.target.id;
    board.target.outerHTML = `<input class="board-title" id="input-${boardId}" data-board-title-id="${titleId}" value="${text}">`
    const input = document.querySelector(`#input-${boardId}`)
    input.addEventListener('keyup', function test(event) {
        if (event.code === "Enter" ) {
            const inputText = event.target.value;
            event.target.outerHTML = `<span class="board-title" id="${boardId}">${inputText}</span>`
            const boardTitle = document.querySelector(`#${boardId}`);
            dataHandler.renameBoard(titleId, inputText);
            boardTitle.addEventListener('click', renameBoard);
        } else if (event.code === "Escape") {
            event.target.outerHTML = `<span class="board-title" id="${boardId}" data-board-title-id="${titleId}">${text}</span>`
            const boardTitle = document.querySelector(`#${boardId}`);
            boardTitle.addEventListener('click', renameBoard);
        }
    })
}

export async function removeBoard(boardId){
    const board = document.querySelector(`[data-board-id="${boardId}"]`)
    if (board != null){
         board.parentElement.remove();
         await dataHandler.deleteBoard(boardId);
    }
}

export function initDropdown() {
    let hamburgerButtons = document.querySelectorAll('.hamburger-btn');
    let optionMenus = document.querySelectorAll('.options-menu');
    hamburgerButtons.forEach(button => {
        let buttonId = button.id;
        let optionsId = "options-menu-"+buttonId;
        let options = document.getElementById(optionsId);
        button.addEventListener('click', () => {
            optionMenus.forEach(currentOptions => {
                if(currentOptions!==options) {
                    currentOptions.classList.remove('show');
                }
            });
            options.classList.toggle('show');
        });
        const boardId = optionsId.slice(-1);
        const columnId = optionsId.slice(-2, -1);
        const addCardButtonId = "newCard"+boardId+columnId;
        const addCardButton = document.getElementById(addCardButtonId);
        addCardButton.addEventListener('click', () => {
            options.classList.remove('show');
            addCard(boardId, columnId);
        });
    });
}

export async function reloadBoardsAndCards() {
    await document.querySelectorAll('.board-container').forEach(board => board.innerHTML = '')
    boardsManager.loadBoards().then(boardsManager.modifyingColumns);
}

function saveTargetElementToLocalStorage(emptyColumn, boardId, columnId){
    localStorage.setItem('emptyColumn', emptyColumn)
    localStorage.setItem('columnBoardId', boardId)
    localStorage.setItem('columnId', columnId)
}