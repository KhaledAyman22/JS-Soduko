(function () {
    var EMPTY = 'rgb(227, 227, 227)', NORMAL = 'rgb(32, 123, 255)', ERROR = 'rgb(252, 78, 78)',
        H_EMPTY = 'rgb(208, 196, 232)', H_AREA = 'rgb(125, 78, 252)', H_CELL = 'rgb(0, 232, 242)', H_OCC = 'rgb(123, 73, 166)';


    var board_solved, board_unsolved,
        insertable = [], empty = [], undoArr = [],
        numberSelected = null,
        numberUsageArr = [0, 0, 0, 0, 0, 0, 0, 0, 0],
        mistakeCount = 0, notes = false;

    BodyLoad();

    function SetIds() {
        var i = 0, j = 0;
        for (let row of document.getElementsByTagName('tr')) {
            for (let col of row.getElementsByTagName('td')) {
                for (let cell of col.getElementsByTagName('button')) {
                    if (cell.nodeType === Node.ELEMENT_NODE) {
                        cell.id = `c${i}${j}`;
                        j++;
                    }
                }
            }
            i++;
            j = 0;
        }
    }

    function SetCellOnClick() {
        for (var btn of document.getElementsByClassName('num_block')) {
            btn.onclick = CellClick;
        }
    }

    function SetSudoku() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board_unsolved[i][j] === 0) {
                    document.getElementById(`c${i}${j}`).style.backgroundColor = EMPTY;
                }
                else
                    document.getElementById(`c${i}${j}`).innerText = board_unsolved[i][j];
            }
        }
    }

    function BuildBoard(diff) {
        var game = Play(diff);
        board_solved = game[0];
        board_unsolved = game[1];

    }

    function BodyLoad() {
        SetIds();
        SetCellOnClick();
        BuildBoard('e');
        SetSudoku();

        toggleSelectedNumbers();
        toggleNotes();
        eventListenerCall();

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                let tmp = board_unsolved[i][j];

                if (tmp === 0) {
                    insertable.push(`${i}${j}`);
                    empty.push(`${i}${j}`);
                } else numberUsageArr[tmp - 1]++;
            }
        }
    }

    function HighlightBox(r, c) {
        r = Math.floor(r / 3) * 3;
        c = Math.floor(c / 3) * 3;

        for (let i = r; i < r + 3; i++) {
            for (let j = c; j < c + 3; j++) {
                var cell = document.getElementById(`c${i}${j}`);
                if (cell.style.backgroundColor !== ERROR) {
                    if (board_unsolved[i][j] === 0)
                        cell.style.backgroundColor = H_EMPTY;
                    else
                        cell.style.backgroundColor = H_AREA;
                }
            }
        }
    }

    function HighlightRowCol(r, c) {
        for (let i = 0; i < 9; i++) {
            var cell_r = document.getElementById(`c${r}${i}`),
                cell_c = document.getElementById(`c${i}${c}`);

            if (board_unsolved[r][i] === 0)
                cell_r.style.backgroundColor = H_EMPTY;
            else
                cell_r.style.backgroundColor = H_AREA;

            if (board_unsolved[i][c] === 0)
                cell_c.style.backgroundColor = H_EMPTY;
            else
                cell_c.style.backgroundColor = H_AREA;
        }
    }

    function HighlightNumber(n) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                var cell = document.getElementById(`c${i}${j}`);

                if (board_unsolved[i][j] === n)
                    cell.style.backgroundColor = H_OCC;
            }
        }
    }

    function ResetHighlight() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                var cell = document.getElementById(`c${i}${j}`);

                if (board_unsolved[i][j] === 0)
                    cell.style.backgroundColor = EMPTY;
                else
                    cell.style.backgroundColor = NORMAL;
            }
        }
    }

    function Highlight(r, c, highlightMistake, highlightDuplicate) {
        var n = board_unsolved[r][c];
        ResetHighlight();
        HighlightBox(r, c);
        HighlightRowCol(r, c);
        if (n !== 0) HighlightNumber(n);

        document.getElementById(`c${r}${c}`).style.backgroundColor = H_CELL;

        if (highlightDuplicate) HighlightRuleError();
        if (highlightMistake) HighlightSolutionError(r, c);}

    function HighlightSolutionError(r, c) {
        if (board_unsolved[r][c] !== board_solved[r][c])
            document.getElementById(`c${r}${c}`).style.backgroundColor = ERROR;
    }

    function HighlightRuleError() {

        // ROWS & COLS
        var all_occ_r = [], all_occ_c = [];
        for (let i = 0; i < 9; i++) {
            var occ1 = {}, occ2 = {};
            for (let j = 0; j < 9; j++) {
                let tmp = board_unsolved[i][j];

                if (tmp !== 0)
                    occ1[tmp] = occ1[tmp] === undefined ? 1 : occ1[tmp] + 1;

                tmp = board_unsolved[j][i];
                if (tmp !== 0)
                    occ2[tmp] = occ2[tmp] === undefined ? 1 : occ2[tmp] + 1;
            }
            all_occ_r.push(occ1);
            all_occ_c.push(occ2);
        }
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                let tmp = board_unsolved[i][j];
                if (tmp !== 0 && all_occ_r[i][tmp] > 1) {
                    document.getElementById(`c${i}${j}`).style.backgroundColor = ERROR;
                }

                tmp = board_unsolved[j][i];
                if (tmp !== 0 && all_occ_c[i][tmp] > 1) {
                    document.getElementById(`c${j}${i}`).style.backgroundColor = ERROR;
                }
            }
        }

        // BOX
        var r = 0, c = 0;
        var all_occ = []
        for (let i = 0; i < 9; i++) {
            var occ = {};
            for (let j = r; j < r + 3; j++) {
                for (let k = c; k < c + 3; k++) {
                    let tmp = board_unsolved[j][k];
                    if (tmp !== 0)
                        occ[tmp] = occ[tmp] === undefined ? 1 : occ[tmp] + 1;
                }
            }
            c += 3;
            if (c === 9) {
                c = 0;
                r += 3;
            }
            all_occ.push(occ);
        }

        r = 0; c = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = r; j < r + 3; j++) {
                for (let k = c; k < c + 3; k++) {
                    let tmp = board_unsolved[j][k];
                    if (tmp !== 0 && all_occ[i][tmp] > 1) {
                        document.getElementById(`c${j}${k}`).style.backgroundColor = ERROR;
                    }
                }
            }
            c += 3;
            if (c === 9) {
                c = 0;
                r += 3;
            }
        }
    }

    function CellClick(evt) {
        var r = parseInt(evt.target.id[1]), c = parseInt(evt.target.id[2]);

        //if(eraseon)
        if (numberSelected) {
            if (notes) cellWrite(r, c, true);
            else cellWrite(r, c, false);
        }


        Highlight(r, c, true, true);
    }

    function cellWrite(r, c, isNote) {
        if (insertable.indexOf(`${r}${c}`) === -1) return;

        var selectedCell = document.getElementById(`c${r}${c}`);

        if (isNote) {
            selectedCell.innerText = numberSelected;
        }

        else {
            //mistakeCounter();
            if (board_unsolved[r][c] !== 0) {
                numberUsageTracker('remove', board_unsolved[r][c]);
            }

            undoArr.push(`${numberSelected}${board_unsolved[r][c]}${r}${c}`);

            selectedCell.innerText = numberSelected;
            board_unsolved[r][c] = numberSelected;

            //remove from empty
            var idx = empty.indexOf(`${r}${c}`);
            if (idx !== -1)
                empty.splice(idx, 1);

            numberUsageTracker('add', numberSelected);
        }

    }

    function eventListenerCall() {
        document.getElementById("undo").addEventListener("click", undoNumber);
        document.getElementById("notes").addEventListener("click", takingNotes);
    }

    function takingNotes() {
        // called by the eventListener
    }

    function cellScrap() {
        // to remove the deleted cell from board_inserted
    }

    function undoNumber() {

        if (undoArr.length !== 0) {

            var history = undoArr.pop();

            var _new = parseInt(history[0]);
            var _old = parseInt(history[1]);
            var r = parseInt(history[2]);
            var c = parseInt(history[3]);

            var selectedCell = document.getElementById(`c${r}${c}`);

            numberUsageTracker('remove', _new);
            numberUsageTracker('add', _old);

            selectedCell.innerText = _old === 0 ? '' : _old;
            board_unsolved[r][c] = _old;

            Highlight(r, c);
        }
    }

    function mistakeCounter() {
        if (mistakeCount === 2) {
            // alert("You lose");
            document.getElementById("mistakes").innerText = `mistakes: 3/3`;
        } else {
            document.getElementById("mistakes").innerText = `mistakes: ${++mistakeCount}/3`;

        }

    }

    function numberUsageTracker(operation, targetNumber) {
        if (targetNumber <= 0) return;

        if (operation === 'add') numberUsageArr[targetNumber - 1]++;
        else if (operation === 'remove') numberUsageArr[targetNumber - 1]--;
        else return;

        var tmp = document.getElementById(`n${targetNumber}`);

        if (numberUsageArr[targetNumber - 1] === 9) {
            tmp.disabled = true;
            tmp.className = 'numControlDisabled'
            numberSelected = null;
        } else {
            if (tmp.disabled === null || tmp.disabled === true) {
                tmp.disabled = false;
                tmp.className = 'numControlEnabled';
            }
        }

    }

    function targetAbutton(i) {
        var header = document.getElementById("findSelectedNumberDiv");
        var btns = header.getElementsByTagName("button");
        return btns[i];

    }

    function toggleSelectedNumbers() {
        //adds an eventListener to all the numbered buttons
        var header = document.getElementById("findSelectedNumberDiv");
        var btns = header.getElementsByTagName("button");
        for (var i = 0; i < btns.length; i++) {

            /*   1- Add Event listener to each number key.  */
            btns[i].addEventListener("click", numberClicked);
        }

    }

    function numberClicked(evt) {
        var _newSelected = parseInt(evt.target.id[1]);

        if (numberSelected === _newSelected) {
            document.getElementById(`n${numberSelected}`).className = 'numControlEnabled';
            numberSelected = null;
        }

        else {
            if (numberSelected !== null)
                document.getElementById(`n${numberSelected}`).className = 'numControlEnabled';
            document.getElementById(`n${_newSelected}`).className = 'numSelected';

            numberSelected = _newSelected;
        }

    }

    function toggleNotes() {

        document.getElementsByClassName("notesStyle")[0].addEventListener("click", function () {
            var current = document.getElementsByClassName("notesSelected");

            if (this.classList.contains("notesSelected")) {
                current[0].className = current[0].className.replace("notesSelected", "");
                notes = false;
            } else {
                notes = true;
                this.classList.add("notesSelected");
            }

        });
    }
}())