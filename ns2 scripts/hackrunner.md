# currently on

---


# To do

---

# build system to queue up sets of jobs on a single target
    - start at full money, no security

    - run hack - sleep - weaken - sleep - grow - sleep - weaken - end

        delay = [5, 15, 12, 15],
    -----
    ---------------
    1234------------
    12---------------


## targets

    - targets should only include devices with money that hacking skill is high enough to hit
    - active job listing [0,0,0] should look over all hosts and see if there are any active jobs

---

# run multiple sets of grow/weaken/hack

    - determine timing, order and amount of w/g/h
        - grab amounts from hackrunner, output should be : host - w/g/h   so Joesguns [24,12,7]
        - grab timing from getHackTime getWeakenTime etc... when a server is at full money and no security
        - likely order will always be the same (need to confirm)
        - generated routine should be the following
            - weaken x 24 - wait 10 secs - grow x 12 - wait 5 secs - hack 7
        - have this run as a self enclosed script with fed in arguments
         - could multi thread by repeat running each step multiple times with a delay



    - determine total available ram and run multiple sets as appropriate

    - run a single set of w/g/h on all servers, record how many of each was required
    - run multiple sets with above settings

---

# completed

## loops

loop over each available server

-   if security is not minimum, weaken it to minimum
-   else if wealth is below 100%, grow it to 100
-   else if hack to ~50% money left (testing required)

track any active hacks by building an object containing active weakens,growths, and hacks  
`{'iron-gym' : [20,33,55], 'phantasy' : [44,55,67]}`  
ensure these values are reset as required (if you see sec or wealth at 100% reset those values to 0)

for now don't run multiple sets of grows or hacks

## hosts

    - host should only include devices I have root on
    - it'd be good to collect total amount of available ram on all hosts for later functions