const main1 = () => {
    console.log("hello world 1");
}

const main2 = () => {
    let i = 0;
    for(let j = 0; j < 1000000000000000000; j++) {
        i += j;
    }

    return i;
}

const main3 = () => {
    console.log("hello world 3");
}

const test = () => {
    main1();
    console.log(main2());
    main3();
}

test();