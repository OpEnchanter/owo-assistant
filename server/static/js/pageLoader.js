const moduleConfig = document.getElementById('moduleConfig');

const unloadedModulesSelector = document.getElementById('unloadedModules');

const notificationPopup = document.querySelector('.notification');

async function loadConfigs() {
    moduleConfig.innerHTML = '';
    await fetch('/exposedParams')
        .then(res => {return res.json()})
        .then(data => {
            console.log(data);
            for (module in data) {
                const container = document.createElement('div');
                container.className = 'fg';

                const header = document.createElement('div');
                header.className = "moduleConfigHeader";
                    const moduleHeader = document.createElement('h3');
                    moduleHeader.innerText = module;
                    header.appendChild(moduleHeader);

                    const dropdownController = document.createElement('input');
                    dropdownController.className = "dropdownController";
                    dropdownController.type = "checkbox";
                    header.appendChild(dropdownController);

                container.appendChild(header);

                const dropdown = document.createElement('div');
                dropdown.className = "dropdown";
                
                Object.keys(data[module]).forEach(field => {
                    const fieldLabel = document.createElement('label');
                    fieldLabel.for = field;
                    fieldLabel.innerText = field;

                    const fieldInput = document.createElement('input');
                    fieldInput.type = 'text';
                    fieldInput.name = field;
                    fieldInput.id = field;
                    fieldInput.setAttribute('data-path', `${module}/${field}`);
                    fieldInput.value = data[module][field]

                    dropdown.appendChild(fieldLabel);
                    dropdown.appendChild(fieldInput);
                });
                container.appendChild(dropdown);
                moduleConfig.appendChild(container)
            }

            if (Object.keys(data).includes("llm.ts")) {
                const postProcessingContainer = document.createElement('div');
                postProcessingContainer.className = "fg";

                    const title = document.createElement("h3");
                    title.innerText = "Post Processing";
                    postProcessingContainer.appendChild(title);

                    const row = document.createElement("div");
                    row.className = "linear";

                        const label = document.createElement("p");
                        label.innerText = "Natural Language Post Processing"
                        row.appendChild(label)

                        const info = document.createElement("div");
                        info.className = "info";
                            const text = document.createElement("p");
                            text.innerText = "i";
                            info.appendChild(text);

                            const popover = document.createElement("div");
                            popover.className = "popover";
                            popover.innerText = "The result of modules will be fed to an LLM to provide more natural responses.";
                            info.appendChild(popover);
                        row.appendChild(info);

                        const lever = document.createElement("label");
                        lever.className = "switch"
                            const checkbox = document.createElement("input")
                            checkbox.setAttribute("data-path", `test.ts/xyz`);
                            checkbox.type = "checkbox";
                            lever.appendChild(checkbox)
                        row.appendChild(lever);

                    postProcessingContainer.appendChild(row);

                moduleConfig.appendChild(postProcessingContainer);
            }

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.innerText = 'Save';

            moduleConfig.appendChild(submitButton);
        });
}

async function loadModules() {
    const loadedModules = document.getElementById('loadedModules');
    loadedModules.innerHTML = '';
    await fetch("/loadedModules")
        .then(data => {return data.json()})
        .then(moduleNames => {
            moduleNames.forEach(name => {
                const chip = document.createElement('div');
                chip.className = 'chip';

                    const left = document.createElement('div');
                    left.className = 'left';
                    left.innerText = name;

                    const right = document.createElement('div');
                    right.className = 'right';


                        const removeButton = document.createElement('button');
                        removeButton.className = 'remove';
                        removeButton.innerText = "x";
                        
                        removeButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const mname = name;
                            await fetch('/removeModule', {
                                method: 'POST',
                                headers: {'Content-Type': 'application/json'},
                                body: JSON.stringify({'moduleName':mname})
                            })
                                .then((res) => {
                                    if (res.status = 200) {
                                        notificationPopup.style.top = "15px";
                                        notificationPopup.style.background = "var(--info)";
                                        notificationPopup.innerText = "Module removed!"

                                        setTimeout(() => {
                                            notificationPopup.style.top = "-150px";
                                        }, 1500);
                                    } else {
                                        notificationPopup.style.top = "15px";
                                        notificationPopup.style.background = "var(--error)";
                                        notificationPopup.innerText = "Module failed to remove."

                                        setTimeout(() => {
                                            notificationPopup.style.top = "-150px";
                                        }, 1500);
                                    }
                                });
                            loadAll();
                        });

                        right.appendChild(removeButton);

                chip.appendChild(left);
                chip.appendChild(right);
                loadedModules.appendChild(chip);
            });
        });
}

const addModuleButton = document.getElementById('addModule');
addModuleButton.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log(unloadedModulesSelector.value);
    await fetch("/loadModule", {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'moduleName':unloadedModulesSelector.value})
    })
        .then(res => {
            console.log(res);
            if (res.status == 200) {
                notificationPopup.style.top = "15px";
                notificationPopup.style.background = "var(--success)";
                notificationPopup.innerText = "Module loaded!"

                setTimeout(() => {
                    notificationPopup.style.top = "-150px";
                }, 1500);
            } else {
                notificationPopup.style.top = "15px";
                notificationPopup.style.background = "var(--error)";
                notificationPopup.innerText = "Module failed to load."

                setTimeout(() => {
                    notificationPopup.style.top = "-150px";
                }, 1500);
            }
        });
    loadAll();
});

async function addUnloadedModules() {
    unloadedModulesSelector.innerHTML = '';
    await fetch("/unloadedModules")
        .then(data => { return data.json() })
        .then(json => { 
            json.forEach(moduleName => {
                const elem = document.createElement('option');
                elem.value = moduleName;
                elem.innerText = moduleName;

                unloadedModulesSelector.appendChild(elem);
            });
            unloadedModulesSelector.placeholder = 'test';
            unloadedModulesSelector.value = '';
        })
}


moduleConfig.addEventListener('submit', async (e) => {
    e.preventDefault();

    const inputs = moduleConfig.querySelectorAll('[data-path]');
    let data = {};

    inputs.forEach(e => {
        let pathString = e.getAttribute('data-path');
        let paths = pathString.split('/');

        if (!Object.keys(data).includes(paths[0])) {
            data[paths[0]] = {};
        }
        
        if (e.type === "checkbox") {
            data[paths[0]][paths[1]] = e.checked;
        } else {
            data[paths[0]][paths[1]] = e.value;
        }
    });

    console.log(data);

    await fetch('/updateConfigs', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
        .then(res => {
            console.log(res);
            if (res.status == 200) {
                notificationPopup.style.top = "15px";
                notificationPopup.style.background = "var(--success)";
                notificationPopup.innerText = "Configs updated!"

                setTimeout(() => {
                    notificationPopup.style.top = "-150px";
                }, 1500);
            }
        });


    console.log(data);
});

function loadAll() {
    loadConfigs();
    loadModules();
    addUnloadedModules();
}

loadAll();