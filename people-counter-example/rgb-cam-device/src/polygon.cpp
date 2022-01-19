
#include <peopleCounter.hpp>




Polygon::Polygon (Points &vertices) : m_vertices (vertices) {}




void Polygon::add_vertex (Point point) {
    m_vertices.push_back(point);
}




void Polygon::reset_vertices (Points &new_vertices) {
    m_vertices.clear();
    m_vertices  = new_vertices;
}




bool Polygon::contains (Point point) {
    int i           = 0,
        j           = 0,
        nvert       = m_vertices.size();
    Points &pts     = std::ref(m_vertices);
    bool contained  = false;

    for (i=0, j=nvert-1; i<nvert; j=i++) {
        if(((pts[i].y >= point.y) != (pts[j].y >= point.y)) &&
            (point.x <= (pts[j].x-pts[i].x) * (point.y-pts[i].y) / (pts[j].y-pts[i].y) + pts[i].x))
                contained = !contained;
    }

    return contained;
}