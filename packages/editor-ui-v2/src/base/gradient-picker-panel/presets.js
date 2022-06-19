const presets = [
    ['#FF6FD8', '#3813C2'],
    ['#FFECD2', '#FF6FAB'],
    ['#FFF886', '#F072B6'],
    ['#52E5E7', '#130CB7'],
    ['#92FFC0', '#002661'],
    ['#2575FC', '#6A11CB'],
    ['#FF0000', '#105EF5'],
    ['#FFFFFF', '#000000'],
    ['#43CBFF', '#9708CC'],
    ['#00FFDA', '#105EF5'],
    ['#F8EDD4', '#0F393D'],
    ['#00FAFF', '#F51089'],
    ['#FFEFEF', '#F51089'],
    ['#FFFBEF', '#F5A610'],
    ['#EFFFFA', '#10F5C7'],
    ['#EFF0FF', '#1065F5'],
    ['#FFEFFB', '#F51044'],
    ['#FFEFFB', '#FF9CA3'],
    ['#FFFBEF', '#FFB19C'],
    ['#EFFFF1', '#BE9CFF'],
];

export default presets.map(preset => ({
    angle: 0,
    stops: [
        {
            color: preset[0],
            offset: 0
        }, {
            color: preset[1],
            offset: 1
        }
    ]
}));
