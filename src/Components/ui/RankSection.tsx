type Props = {
  title: string;
};

function RankSection({ title }: Props) {
  return (
    <div className="rank-section">
      <h3 className="rank-title">{title}</h3>

      <ul className="rank-list">
        {Array.from({ length: 10 }).map((_, index) => (
          <li className="rank-item" key={index}>
            <span className="rank-number">{index + 1}</span>
            <span className="rank-text">노래 제목 {index + 1} - 가수</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RankSection;
