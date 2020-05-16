function check(str) {
    let reg=/^[0-9a-fA-F][^IOQU]$/;
    return reg.test(str);
}

console.log(check('0eab89a271380b09987bcee5258fca91f28df4dadcedf892658b9bc261050d96'))